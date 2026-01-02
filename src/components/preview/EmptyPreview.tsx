import { FileText, MessageSquare, Image, Sparkles, ArrowLeft } from 'lucide-react';

// Animated floating dot
const FloatingDot = ({ delay, x, y, size = 4 }: { delay: number; x: string; y: string; size?: number }) => (
  <div
    className="absolute rounded-full bg-primary/20 animate-pulse"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      animationDuration: '3s',
    }}
  />
);

// Tip card component
const TipCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  delay: number;
}) => (
  <div
    className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 transition-all duration-300 hover:bg-muted hover:border-primary/20 hover:shadow-sm"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

export const EmptyPreview = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      {/* Abstract illustration */}
      <div className="relative w-48 h-48 mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

        {/* Central icon cluster */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Main document */}
          <div className="relative">
            <div className="w-24 h-32 bg-gradient-to-br from-background via-background to-muted rounded-lg border-2 border-primary/20 shadow-lg shadow-primary/5 flex flex-col items-center justify-center gap-2">
              {/* Document lines */}
              <div className="w-14 h-1.5 bg-primary/20 rounded-full" />
              <div className="w-12 h-1.5 bg-primary/15 rounded-full" />
              <div className="w-10 h-1.5 bg-primary/10 rounded-full" />
              <div className="w-8 h-1.5 bg-primary/5 rounded-full" />

              {/* Sparkle accent */}
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>

            {/* Floating elements around the document */}
            <div className="absolute -left-8 top-4 w-8 h-6 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded border border-primary/10 animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute -right-6 top-8 w-6 h-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-primary/10 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -left-4 bottom-6 w-5 h-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded border border-primary/10 rotate-12 animate-float" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Floating dots for ambient motion */}
        <FloatingDot delay={0} x="15%" y="20%" size={6} />
        <FloatingDot delay={0.5} x="80%" y="25%" size={4} />
        <FloatingDot delay={1} x="10%" y="70%" size={5} />
        <FloatingDot delay={1.5} x="85%" y="65%" size={3} />
        <FloatingDot delay={2} x="50%" y="10%" size={4} />
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        Your content will appear here
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm">
        Start a conversation to generate branded content for your customer
      </p>

      {/* Tips */}
      <div className="w-full max-w-md space-y-3">
        <TipCard
          icon={MessageSquare}
          title="Describe what you need"
          description="Tell the AI what content you want to create — a welcome page, company values, team intro, etc."
          delay={0}
        />
        <TipCard
          icon={FileText}
          title="Upload reference files"
          description="Drop a PDF, document, or paste a URL to give the AI context about your content"
          delay={100}
        />
        <TipCard
          icon={Image}
          title="Generate matching imagery"
          description="Once you have text content, use 'Generate Imagery' to create on-brand visuals"
          delay={200}
        />
      </div>

      {/* Arrow pointing to chat */}
      <div className="mt-8 flex items-center gap-2 text-muted-foreground/60">
        <ArrowLeft className="w-4 h-4 animate-bounce-x" />
        <span className="text-xs">Start chatting on the left</span>
      </div>
    </div>
  );
};
