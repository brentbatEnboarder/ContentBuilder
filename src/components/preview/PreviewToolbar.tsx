import { useState } from 'react';
import { Copy, Download, RotateCw, Loader2, FileText, Sparkles } from 'lucide-react';
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

  return (
    <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-card via-card to-slate-50/50 dark:to-slate-900/50 px-4 py-2.5">
      {/* Left section: Voice & Word Count */}
      <div className="flex items-center gap-2">
        <VoiceDropdown onNavigateToSettings={onNavigateToVoice} />

        {/* Word count badge with teal accent */}
        {hasContent && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20">
            <FileText className="w-3 h-3 text-teal" />
            <span className="text-xs font-semibold text-teal tabular-nums">
              {wordCount.toLocaleString()}
            </span>
            <span className="text-xs text-teal/70">
              {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        )}
      </div>

      {/* Center section: Target Length Controls */}
      <div className="flex items-center gap-3">
        <TargetLengthControl
          value={styleSettings.targetWordLength}
          onChange={setTargetWordLength}
          onAdjust={adjustTargetLength}
          disabled={isGenerating}
        />

        {/* Regenerate button - Teal branded */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={!hasContent || isGenerating}
              className="
                flex items-center justify-center gap-1.5 px-4 h-[42px] rounded-xl
                bg-gradient-to-b from-teal to-teal-hover
                border border-teal-hover/50
                shadow-[0_2px_8px_rgba(93,237,215,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
                hover:from-teal-hover hover:to-teal
                hover:shadow-[0_4px_12px_rgba(93,237,215,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]
                active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
                transition-all duration-150 ease-out
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                group
              "
            >
              <RotateCw
                className={`w-4 h-4 text-white ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}
                strokeWidth={2.5}
              />
              <span className="text-xs font-semibold text-white uppercase tracking-wide">
                Regenerate
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Regenerate content with current settings</TooltipContent>
        </Tooltip>
      </div>

      {/* Right section: Export Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={handleCopy}
              disabled={!hasContent}
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
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
                  className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  disabled={!hasContent}
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportMarkdown} className="gap-2">
              <FileText className="w-4 h-4" />
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportWord} disabled={isDownloading} className="gap-2">
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Word Document (.docx)
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportImages} disabled={!hasImages || isDownloading} className="gap-2">
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Images (.zip)
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAll} disabled={isDownloading} className="gap-2">
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  All Content (.zip)
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
