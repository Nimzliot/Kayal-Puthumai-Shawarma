create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role'
  ) then
    create type public.app_role as enum ('customer', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'order_status'
  ) then
    create type public.order_status as enum (
      'order_placed',
      'accepted',
      'preparing',
      'out_for_delivery',
      'delivered',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tamil_name text not null,
  english_name text not null,
  image text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  prep_time integer not null check (prep_time > 0),
  description text not null,
  is_veg boolean not null default false,
  spice_level text not null default 'Medium',
  addons jsonb not null default '[]'::jsonb,
  stock_available boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  status public.order_status not null default 'order_placed',
  total_amount numeric(10,2) not null check (total_amount >= 0),
  subtotal_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  delivery_charge numeric(10,2) not null default 0,
  delivery_address text not null,
  gps_latitude numeric,
  gps_longitude numeric,
  payment_method text not null default 'cash_on_delivery',
  tip_amount numeric(10,2) not null default 0,
  eta_minutes integer not null default 30,
  eta_started_at timestamptz not null default now(),
  timing_status text not null default 'tracking' check (timing_status in ('tracking', 'on_time', 'late')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists eta_started_at timestamptz not null default now();

alter table public.orders
  add column if not exists timing_status text not null default 'tracking';

alter table public.orders
  drop constraint if exists orders_timing_status_check;

alter table public.orders
  add constraint orders_timing_status_check check (timing_status in ('tracking', 'on_time', 'late'));

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  prep_time_snapshot integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  address_line text not null,
  phone text,
  gps_latitude numeric,
  gps_longitude numeric,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.saved_addresses
  add column if not exists phone text;

create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_role public.app_role;
  profile_name text;
begin
  profile_role := case
    when coalesce(new.raw_user_meta_data ->> 'registration_source', '') = 'website' then 'customer'
    else 'admin'
  end;

  profile_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Customer'
  );

  insert into public.users (id, name, phone, email, role)
  values (
    new.id,
    profile_name,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    profile_role
  )
  on conflict (id) do update
  set
    name = excluded.name,
    phone = coalesce(excluded.phone, public.users.phone),
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.users (id, name, phone, email, role)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'name', ''),
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
    'Customer'
  ),
  nullif(auth_user.raw_user_meta_data ->> 'phone', ''),
  auth_user.email,
  case
    when coalesce(auth_user.raw_user_meta_data ->> 'registration_source', '') = 'website' then 'customer'::public.app_role
    else 'admin'::public.app_role
  end
from auth.users as auth_user
where not exists (
  select 1
  from public.users
  where public.users.id = auth_user.id
);

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Public can read enabled products" on public.products;
create policy "Public can read enabled products"
on public.products for select
using (enabled = true and stock_available = true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own profile" on public.users;
create policy "Users read own profile"
on public.users for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile"
on public.users for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "Admins manage user profiles" on public.users;
create policy "Admins manage user profiles"
on public.users for insert
with check (public.is_admin());

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
on public.orders for select
using (
  auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Authenticated users create own orders" on public.orders;
create policy "Authenticated users create own orders"
on public.orders for insert
with check (auth.uid() = user_id);

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read their order items" on public.order_items;
create policy "Users read their order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_items.order_id
      and (public.orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Users create their order items" on public.order_items;
create policy "Users create their order items"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_items.order_id and public.orders.user_id = auth.uid()
  )
);

drop policy if exists "Users manage own reviews" on public.reviews;
create policy "Users manage own reviews"
on public.reviews for select
using (true);

drop policy if exists "Authenticated users create reviews" on public.reviews;
create policy "Authenticated users create reviews"
on public.reviews for insert
with check (auth.uid() = user_id);

drop policy if exists "Users manage own addresses" on public.saved_addresses;
create policy "Users manage own addresses"
on public.saved_addresses for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
on public.favorites for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
on public.notifications for select
using (auth.uid() = user_id or public.is_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
