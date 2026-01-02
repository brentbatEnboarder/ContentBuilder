interface SampleCardProps {
  badge: string;
  title: string;
  content: string;
}

export const SampleCard = ({ badge, title, content }: SampleCardProps) => {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
          {badge}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3 font-medium">{title}</p>
      <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
};
