"use client";

import { motion } from "framer-motion";

export function BrandingIntro() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-brand/20 bg-hero px-6 py-16 shadow-glow sm:px-10">
      <div className="absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 rounded-full border border-brand/30 bg-brand/10 blur-3xl" />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-5">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex rounded-full border border-brand/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand"
          >
            Order Fresh Shawarma Online
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl"
          >
            <span className="gold-text block">காயல் புதுமை ஷவர்மா</span>
            <span className="mt-3 block text-white">Kayal Puthumai Shawarma</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="max-w-2xl text-sm leading-7 text-foreground/75 sm:text-base"
          >
            A premium local delivery experience with black-and-gold neon styling, fast
            kitchen updates, and your favorite shawarma made fresh for every order.
          </motion.p>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative h-64 w-64"
          >
            <div className="absolute inset-0 animate-pulseGlow rounded-full border border-brand/30 bg-brand/10 blur-xl" />
            <div className="absolute inset-6 rounded-full border border-dashed border-brand/40" />
            <div className="absolute inset-12 animate-slowSpin rounded-full border-t-4 border-brand border-r-4 border-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-brand/30 bg-black/80 px-8 py-10 text-center shadow-glow">
                <div className="text-5xl">🥙</div>
                <p className="mt-3 text-xs uppercase tracking-[0.4em] text-brand">
                  Fresh • Hot • Fast
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
