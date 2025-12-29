export const LoadingMessage = () => {
  return (
    <div className="flex flex-col max-w-[85%] gap-1 self-start items-start">
      <div className="flex items-center gap-2 text-xs">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#7C21CC' }}
        >
          <img
            src="/enboarder-icon-white.png"
            alt="AI"
            className="w-4 h-4"
          />
        </div>
        <span className="font-medium text-foreground">Enboarder</span>
      </div>
      <div
        className="rounded-xl rounded-bl-sm px-4 py-3"
        style={{ backgroundColor: '#e0c4f4' }}
      >
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
