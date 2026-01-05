import { useState } from 'react';
import { Copy, Download, RotateCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VoiceDropdown } from './VoiceDropdown';
import { TargetLengthControl } from './TargetLengthControl';
import { useStyleSettings } from '@/hooks/useStyleSettings';
import { toast } from 'sonner';
import type { ContentBlock } from '@/types/content';
import {
  downloadAsMarkdown,
  downloadImagesAsZip,
  downloadAllAsZip,
  downloadAsWord,
  createBlocksFromLegacyContent,
} from '@/utils/downloadUtils';

interface PreviewToolbarProps {
  content: string;
  hasContent: boolean;
  isGenerating: boolean;
  onNavigateToVoice: () => void;
  onRegenerate: () => void;
  contentBlocks?: ContentBlock[];
  pageTitle?: string;
  images?: string[];
}

export const PreviewToolbar = ({
  content,
  hasContent,
  isGenerating,
  onNavigateToVoice,
  onRegenerate,
  contentBlocks = [],
  pageTitle = 'Untitled',
  images = [],
}: PreviewToolbarProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { settings: styleSettings, setTargetWordLength, adjustTargetLength } = useStyleSettings();

  // Calculate word count (split on whitespace, filter empty strings)
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Get blocks - use contentBlocks if available, otherwise create from legacy content
  const getBlocks = (): ContentBlock[] => {
    if (contentBlocks.length > 0) {
      return contentBlocks;
    }
    // Fall back to creating blocks from legacy content/images
    return createBlocksFromLegacyContent(content, images);
  };

  // Check if there are any images
  const hasImages = contentBlocks.some((b) => b.type === 'image') || images.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleExportMarkdown = () => {
    try {
      const blocks = getBlocks();
      downloadAsMarkdown(blocks, pageTitle);
      toast.success('Markdown downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download markdown');
    }
  };

  const handleExportImages = async () => {
    try {
      setIsDownloading(true);
      const blocks = getBlocks();
      await downloadImagesAsZip(blocks, pageTitle);
      toast.success('Images downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.message === 'No images to download') {
        toast.error('No images to download');
      } else {
        toast.error('Failed to download images');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsDownloading(true);
      const blocks = getBlocks();
      await downloadAllAsZip(blocks, pageTitle);
      toast.success('Content downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download content');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsDownloading(true);
      const blocks = getBlocks();
      await downloadAsWord(blocks, pageTitle);
      toast.success('Word document downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download Word document');
    } finally {
      setIsDownloading(false);
    }
  };

  // 3D regenerate button styles (matching shorter/longer)
  const regenerateButtonClasses = `
    flex items-center justify-center gap-1.5 px-3 h-[42px] rounded-lg
    bg-gradient-to-b from-white to-slate-100
    dark:from-slate-700 dark:to-slate-800
    border border-slate-200/80 dark:border-slate-600
    shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]
    dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
    hover:from-slate-50 hover:to-slate-100 hover:border-slate-300
    hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]
    dark:hover:from-slate-600 dark:hover:to-slate-700
    active:from-slate-100 active:to-slate-150 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]
    dark:active:from-slate-750 dark:active:to-slate-800
    transition-all duration-100 ease-out
    disabled:opacity-40 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <VoiceDropdown onNavigateToSettings={onNavigateToVoice} />

        {/* Word count pill */}
        {hasContent && (
          <div className="flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
              {wordCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
              {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        )}

        <div className="w-px h-8 bg-border" />

        <TargetLengthControl
          value={styleSettings.targetWordLength}
          onChange={setTargetWordLength}
          onAdjust={adjustTargetLength}
          disabled={isGenerating}
        />

        {/* Regenerate button - 3D style */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={!hasContent || isGenerating}
              className={regenerateButtonClasses}
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isGenerating ? 'animate-spin' : ''}`} strokeWidth={2.5} />
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Regenerate</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Regenerate content</TooltipContent>
        </Tooltip>
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
            <DropdownMenuItem onClick={handleExportMarkdown}>
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportWord} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                'Word Document (.docx)'
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportImages} disabled={!hasImages || isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                'Images (.zip)'
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAll} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                'All Content (.zip)'
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
