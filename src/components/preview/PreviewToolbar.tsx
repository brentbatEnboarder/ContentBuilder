import { Copy, Download, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VoiceDropdown } from './VoiceDropdown';
import { StyleDropdown } from './StyleDropdown';
import { toast } from 'sonner';

interface PreviewToolbarProps {
  content: string;
  hasContent: boolean;
  isGenerating: boolean;
  onNavigateToVoice: () => void;
  onNavigateToStyle: () => void;
  onRegenerate: () => void;
  onStyleChange?: () => void;
}

export const PreviewToolbar = ({
  content,
  hasContent,
  isGenerating,
  onNavigateToVoice,
  onNavigateToStyle,
  onRegenerate,
  onStyleChange,
}: PreviewToolbarProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleExport = (format: string) => {
    toast.info(`Export as ${format} coming soon!`);
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <VoiceDropdown onNavigateToSettings={onNavigateToVoice} />
        <StyleDropdown 
          onNavigateToSettings={onNavigateToStyle} 
          onStyleChange={onStyleChange}
        />
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              disabled={!hasContent}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!hasContent}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('Markdown')}>
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('Word')}>
              Word Document (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('Images')}>
              Images (.zip)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('All')}>
              All Content (.zip)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRegenerate}
              disabled={!hasContent || isGenerating}
            >
              <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
