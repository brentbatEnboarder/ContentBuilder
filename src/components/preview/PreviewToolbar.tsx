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
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <VoiceDropdown onNavigateToSettings={onNavigateToVoice} />
        {hasContent && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
          </span>
        )}
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
