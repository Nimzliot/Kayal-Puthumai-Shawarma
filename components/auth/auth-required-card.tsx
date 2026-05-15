import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthRequiredCard({ nextPath }: { nextPath: string }) {
  const encodedNextPath = encodeURIComponent(nextPath);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-10 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Login Required</p>
        <h1 className="mt-3 font-display text-3xl text-white">Browse freely, login only when ordering</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Customers do not need an account to explore the menu. We only ask for signup or login
          when you are ready to place an order.
        </p>

        <div className="mt-6 rounded-[28px] border border-brand/20 bg-brand/10 p-5 text-sm text-foreground/75">
          <LockKeyhole className="mr-2 inline h-4 w-4 text-brand" />
          Continue with your customer account to complete checkout.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/login?mode=signup&next=${encodedNextPath}`}>Create account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/login?mode=login&next=${encodedNextPath}`}>Login</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
