interface SampleCardProps {
  badge: string;
  title: string;
  content: string;
}

export const SampleCard = ({ badge, title, content }: SampleCardProps) => {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-[hsl(270_100%_98%)] to-[hsl(210_100%_98%)] border border-[hsl(270_100%_94%)]">
      <div className="mb-3">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
          {badge}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
};
