# Kayal Puthumai Shawarma

Single-shop premium food ordering web app for `காயல் புதுமை ஷவர்மா / Kayal Puthumai Shawarma`.

## Stack

- Next.js 15 with App Router
- React 19
- Tailwind CSS
- Framer Motion
- MapLibre with OpenStreetMap tiles
- Supabase Auth and Postgres
- Ready for Vercel deployment

## What is included

- Animated black-and-gold landing page with Tamil and English branding
- Mobile-first menu browsing without login
- Customer signup, login, and forgot-password flow for checkout
- Cart and checkout with preparation-time and ETA calculation
- Free map-based address UI with no Google Maps key required
- COD-only payment UX with online payments marked as coming soon
- Simple order status screen for customers
- Account dashboard for order history and saved addresses
- Admin dashboard for orders, products, and timing analytics
- Supabase SQL schema, seed data, and RLS policies
- Security middleware and protected admin route pattern
- Order creation API with validation, ETA calculation, CSRF-style origin checks, and basic rate limiting

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Local setup

```bash
npm install
npm run dev
```

## Supabase setup

1. Create a new Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql).
3. Run [`supabase/seed.sql`](./supabase/seed.sql).
4. In Supabase Auth, enable:
   - Email login
5. Add your site URL and redirect URLs for local and Vercel environments.
6. No Google Maps setup is required. The project uses MapLibre with OpenStreetMap-based tiles.

## Deployment

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in Vercel.
4. Redeploy after updating Supabase auth redirect URLs.

## Production notes

- Replace static demo data in `lib/data.ts` with live Supabase queries.
- Add Supabase storage bucket integration for product images.
- Add live order history and status queries from Supabase where placeholder content is still used.
- If traffic grows, move from the default public tile source to your own hosted or paid tile provider.
- Consider Upstash Redis or Vercel KV for distributed rate limiting in production.
