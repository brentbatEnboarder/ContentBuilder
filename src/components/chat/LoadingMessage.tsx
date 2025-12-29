import { Bot } from 'lucide-react';

export const LoadingMessage = () => {
  return (
    <div className="flex flex-col max-w-[85%] gap-1 self-start items-start">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted">
          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="font-medium text-foreground">AI</span>
      </div>
      <div className="bg-muted text-foreground rounded-xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
