type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
    </div>
  );
}
