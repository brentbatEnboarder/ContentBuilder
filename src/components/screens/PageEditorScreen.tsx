import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChatPane } from '@/components/chat/ChatPane';
import { PreviewPane } from '@/components/preview/PreviewPane';
import { usePageEditor } from '@/hooks/usePageEditor';
import { useChat } from '@/hooks/useChat';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { toast } from 'sonner';
import type { ScreenType } from '@/hooks/useNavigation';
import type { FileAttachment } from '@/types/page';

interface PageEditorScreenProps {
  pageId: string | null;
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const PageEditorScreen = ({ pageId, onBack, onNavigate }: PageEditorScreenProps) => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  const {
    page,
    isDirty,
    generatedContent,
    isGenerating,
    updateTitle,
    updateGeneratedContent,
    updateChatHistory,
    setIsGenerating,
    save,
  } = usePageEditor(pageId);

  // Image generation hook
  const {
    isGenerating: isGeneratingImages,
    generateImages,
    regenerateImage,
  } = useImageGeneration({
    onImagesGenerated: (newImages) => {
      updateGeneratedContent({
        text: generatedContent.text,
        images: newImages,
      });
    },
  });

  const handleContentGenerated = useCallback(
    async (content: { text: string; images: string[] }) => {
      updateGeneratedContent({ text: content.text, images: [] });

      // Auto-generate images when text is generated (if text is substantial)
      if (content.text.length > 100) {
        try {
          await generateImages(content.text, 3);
        } catch (err) {
          console.error('Auto image generation failed:', err);
          // Don't show error toast - images are optional
        }
      }
    },
    [updateGeneratedContent, generateImages]
  );

  const {
    messages,
    isLoading,
    sendMessage,
  } = useChat({
    initialMessages: page?.chatHistory || [],
    onContentGenerated: handleContentGenerated,
  });

  // Sync chat messages to page editor state
  useEffect(() => {
    if (messages.length > 0) {
      updateChatHistory(messages);
    }
  }, [messages, updateChatHistory]);

  // Initialize title input when page loads
  useEffect(() => {
    if (page?.title) {
      setTitleInput(page.title);
    }
  }, [page?.title]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onBack();
    }
  }, [isDirty, onBack]);

  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    onBack();
  }, [onBack]);

  const handleSave = useCallback(async () => {
    try {
      await save();
      setShowSaved(true);
      toast.success('Page saved successfully');
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      toast.error('Failed to save page');
      console.error('Save error:', error);
    }
  }, [save]);

  const handleTitleSubmit = useCallback(() => {
    if (titleInput.trim()) {
      updateTitle(titleInput.trim());
    } else {
      setTitleInput(page?.title || 'Untitled Page');
    }
    setIsEditingTitle(false);
  }, [titleInput, page?.title, updateTitle]);

  const handleSendMessage = useCallback((message: string, attachments?: FileAttachment[]) => {
    setIsGenerating(true);
    sendMessage(message, attachments);
    // isGenerating will be set to false when content is generated
    setTimeout(() => setIsGenerating(false), 1500);
  }, [sendMessage, setIsGenerating]);

  const handleRegenerate = useCallback(async () => {
    if (!generatedContent.text) {
      toast.error('No content to regenerate');
      return;
    }

    setIsGenerating(true);
    try {
      // Regenerate images based on current text content
      await generateImages(generatedContent.text, 3);
      toast.success('Images regenerated');
    } catch (err) {
      console.error('Regeneration error:', err);
      toast.error('Failed to regenerate images');
    } finally {
      setIsGenerating(false);
    }
  }, [generatedContent.text, generateImages, setIsGenerating]);

  const handleRegenerateImage = useCallback(
    async (index: number) => {
      try {
        const newImage = await regenerateImage(index);
        if (newImage) {
          toast.success(`Image ${index + 1} regenerated`);
        } else {
          toast.error('Failed to regenerate image');
        }
      } catch (err) {
        console.error('Image regeneration error:', err);
        toast.error('Failed to regenerate image');
      }
    },
    [regenerateImage]
  );

  const handleStyleChange = useCallback(() => {
    if (generatedContent.text) {
      toast('Settings updated', {
        description: 'Regenerate content with new settings?',
        action: {
          label: 'Regenerate',
          onClick: handleRegenerate,
        },
      });
    }
  }, [generatedContent.text, handleRegenerate]);

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pages
          </Button>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Page:</span>
            {isEditingTitle ? (
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleInput(page.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="h-8 w-64"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {page.title}
              </button>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!isDirty && !showSaved}
          className="gap-2"
        >
          {showSaved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat Pane - 40% */}
        <div className="w-[40%] min-w-[320px]">
          <ChatPane
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Preview Pane - 60% */}
        <div className="flex-1">
          <PreviewPane
            content={generatedContent}
            isGenerating={isGenerating || isGeneratingImages}
            onNavigateToVoice={() => onNavigate('voice')}
            onNavigateToStyle={() => onNavigate('style')}
            onRegenerate={handleRegenerate}
            onRegenerateImage={handleRegenerateImage}
            onStyleChange={handleStyleChange}
          />
        </div>
      </div>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
