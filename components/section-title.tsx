type SectionTitleProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function SectionTitle({ eyebrow, title, subtitle }: SectionTitleProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-brand">{eyebrow}</p>
      <h2 className="font-display text-3xl text-white sm:text-4xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-7 text-foreground/70 sm:text-base">{subtitle}</p>
    </div>
  );
}
