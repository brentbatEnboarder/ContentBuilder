import { useState, useCallback, useEffect } from 'react';
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
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
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
  const [showSaved, setShowSaved] = useState(false);

  const {
    page,
    isDirty,
    generatedContent,
    isGenerating,
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

  // Handle streaming content updates (no image generation)
  const handleContentStreaming = useCallback(
    (text: string) => {
      updateGeneratedContent({ text, images: generatedContent.images });
    },
    [updateGeneratedContent, generatedContent.images]
  );

  // Handle final content (triggers image generation)
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
    onContentStreaming: handleContentStreaming,
    currentContent: generatedContent.text || undefined,
  });

  // Sync chat messages to page editor state
  useEffect(() => {
    if (messages.length > 0) {
      updateChatHistory(messages);
    }
  }, [messages, updateChatHistory]);

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

  // Register header actions
  useRegisterHeaderActions(
    isDirty,
    false, // isSaving - we handle this locally
    handleSave,
    () => {}, // onCancel - not used for page editor
    {
      onBack: handleBack,
      pageTitle: page?.title || 'Untitled Page',
      showSaved,
    }
  );

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
    <>
      <div className="flex h-full">
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
    </>
  );
};
