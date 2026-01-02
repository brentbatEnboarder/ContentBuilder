import { useState } from 'react';
import { Code, Copy, Check, ChevronDown } from 'lucide-react';
import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';

interface VoiceJsonExportProps {
  values: Record<DimensionKey, number>;
}

export const VoiceJsonExport = ({ values }: VoiceJsonExportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportData = {
    dimensional_positioning: {
      formality: values.formality,
      humor: values.humor,
      respect: values.respect,
      enthusiasm: values.enthusiasm,
    },
    labels: {
      formality: dimensionConfig.formality.values[values.formality].label,
      humor: dimensionConfig.humor.values[values.humor].label,
      respect: dimensionConfig.respect.values[values.respect].label,
      enthusiasm: dimensionConfig.enthusiasm.values[values.enthusiasm].label,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-500/5 to-slate-500/10 border-b border-border/50 hover:from-slate-500/10 hover:to-slate-500/15 transition-colors"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-500/15">
          <Code className="w-4 h-4 text-slate-600" />
        </div>
        <span className="text-sm font-medium text-foreground">Export as JSON</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground ml-auto transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-5">
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
            <pre className="bg-slate-900 text-emerald-400 p-4 pr-24 rounded-xl text-sm font-mono overflow-x-auto">
              {jsonString}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
