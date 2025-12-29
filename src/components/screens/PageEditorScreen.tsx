import { useState, useCallback, useEffect, useRef } from 'react';
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
import { PreviewPane, GeneratedImageSet } from '@/components/preview/PreviewPane';
import { usePageEditor } from '@/hooks/usePageEditor';
import { useChat } from '@/hooks/useChat';
import { useImagePlanning } from '@/hooks/useImagePlanning';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
import { toast } from 'sonner';
import type { ScreenType } from '@/hooks/useNavigation';
import type { FileAttachment, ChatMessage } from '@/types/page';

interface PageEditorScreenProps {
  pageId: string | null;
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const PageEditorScreen = ({ pageId, onBack, onNavigate }: PageEditorScreenProps) => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [plannedImages, setPlannedImages] = useState<GeneratedImageSet[]>([]);
  const isImagePlanningRef = useRef(false);

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

  // Image planning hook
  const {
    state: imagePlanState,
    isPlanningLoading,
    isGenerating: isGeneratingImages,
    startPlanning,
    sendPlanMessage,
    generateImages: generatePlannedImages,
  } = useImagePlanning();

  // Handle streaming content updates (no image generation)
  const handleContentStreaming = useCallback(
    (text: string) => {
      updateGeneratedContent({ text, images: generatedContent.images });
    },
    [updateGeneratedContent, generatedContent.images]
  );

  // Handle final content (no auto image generation - user clicks button)
  const handleContentGenerated = useCallback(
    async (content: { text: string; images: string[] }) => {
      updateGeneratedContent({ text: content.text, images: [] });
    },
    [updateGeneratedContent]
  );

  const {
    messages,
    isLoading,
    sendMessage,
    setMessages,
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

  // Helper to add messages to chat
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [setMessages]);

  const handleSendMessage = useCallback(async (message: string, attachments?: FileAttachment[]) => {
    // Check if we're in image planning mode
    if (isImagePlanningRef.current && imagePlanState === 'planning') {
      // Add user message to chat
      addMessage('user', message);

      // Send to image planning and get AI response
      const result = await sendPlanMessage(generatedContent.text, message);

      if (result) {
        // Add AI response to chat
        addMessage('assistant', result.message);

        if (result.isApproval) {
          // User approved - generate images
          isImagePlanningRef.current = false;
          addMessage('assistant', "Great! I'm generating your images now. This may take a moment...");

          const images = await generatePlannedImages(generatedContent.text);
          if (images.length > 0) {
            setPlannedImages(images);
            toast.success('Images generated successfully!');
          }
        }
      }
      return;
    }

    // Normal chat flow
    setIsGenerating(true);
    sendMessage(message, attachments);
    setTimeout(() => setIsGenerating(false), 1500);
  }, [imagePlanState, sendPlanMessage, generatedContent.text, generatePlannedImages, addMessage, setIsGenerating, sendMessage]);

  // Start image planning when "Generate Imagery" is clicked
  const handleGenerateImages = useCallback(async () => {
    if (!generatedContent.text) {
      toast.error('No content to generate images for');
      return;
    }

    isImagePlanningRef.current = true;

    // Add a user message indicating they want images
    addMessage('user', 'Please analyze the content and suggest images.');

    // Start the planning process and get AI response
    const aiMessage = await startPlanning(generatedContent.text);

    if (aiMessage) {
      // Add AI's recommendations to chat
      addMessage('assistant', aiMessage);
    } else {
      toast.error('Failed to analyze content for images');
      isImagePlanningRef.current = false;
    }
  }, [generatedContent.text, startPlanning, addMessage]);

  const handleRegenerateImage = useCallback(
    async (index: number) => {
      toast.info('Image regeneration coming soon');
    },
    []
  );

  const handleStyleChange = useCallback(() => {
    if (generatedContent.text) {
      toast('Settings updated', {
        description: 'Click "Generate Imagery" to create images with new style.',
      });
    }
  }, [generatedContent.text]);

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
            isLoading={isLoading || isPlanningLoading}
            onSendMessage={handleSendMessage}
            hasContent={!!generatedContent.text}
            isGeneratingImages={isGeneratingImages}
            onGenerateImages={handleGenerateImages}
          />
        </div>

        {/* Preview Pane - 60% */}
        <div className="flex-1">
          <PreviewPane
            content={generatedContent}
            isGenerating={isGenerating}
            onNavigateToVoice={() => onNavigate('voice')}
            onNavigateToStyle={() => onNavigate('style')}
            onRegenerate={handleGenerateImages}
            onRegenerateImage={handleRegenerateImage}
            onStyleChange={handleStyleChange}
            plannedImages={plannedImages}
            isGeneratingImages={isGeneratingImages}
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
