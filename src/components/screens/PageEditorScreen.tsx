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
import { PreviewPane } from '@/components/preview/PreviewPane';
import { usePageEditor } from '@/hooks/usePageEditor';
import { useChat } from '@/hooks/useChat';
import { useImagePlanning } from '@/hooks/useImagePlanning';
import { useImageModal } from '@/hooks/useImageModal';
import { useContentBlocks } from '@/hooks/useContentBlocks';
import { useStyleSettings } from '@/hooks/useStyleSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
import {
  ImageGenerationModal,
  ImageSelectionGrid,
  ImageLightbox,
  EditImagePanel,
  RegeneratePopover,
} from '@/components/modals';
import { toast } from 'sonner';
import type { ScreenType } from '@/hooks/useNavigation';
import type { FileAttachment, ChatMessage } from '@/types/page';
import type { ContentBlock } from '@/types/content';

interface PageEditorScreenProps {
  pageId: string | null;
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const PageEditorScreen = ({ pageId, onBack, onNavigate }: PageEditorScreenProps) => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const isImagePlanningRef = useRef(false);

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

  // Settings hooks for image generation
  const { settings: styleSettings } = useStyleSettings();
  const { settings: companySettings } = useCompanySettings();

  // Content blocks for draggable preview
  const {
    blocks,
    setAllBlocks,
    reorderBlocks,
    deleteBlock,
  } = useContentBlocks();

  // Image planning hook (conversational flow)
  const {
    state: imagePlanState,
    isPlanningLoading,
    isGenerating: isGeneratingImagesLegacy,
    startPlanning,
    sendPlanMessage,
    getRecommendationsForModal,
  } = useImagePlanning();

  // Image modal hook (selection UI)
  const imageModal = useImageModal({
    onImagesApplied: (imageBlocks: ContentBlock[]) => {
      // Separate header and body images
      const headerBlocks = imageBlocks.filter(
        (b) => b.type === 'image' && b.placementType === 'header'
      );
      const bodyBlocks = imageBlocks.filter(
        (b) => b.type === 'image' && b.placementType === 'body'
      );

      // Create text block from current content
      const textBlock: ContentBlock = {
        type: 'text',
        id: 'text-main',
        content: generatedContent?.text || '',
      };

      // Header images first, then text, then body images
      setAllBlocks([...headerBlocks, textBlock, ...bodyBlocks]);

      // IMPORTANT: Also sync images to generatedContent so they get saved
      // Extract image URLs from the image blocks for persistence
      const imageUrls = imageBlocks
        .filter((b): b is ContentBlock & { type: 'image' } => b.type === 'image')
        .map((b) => b.imageUrl);

      updateGeneratedContent({
        text: generatedContent?.text || '',
        images: imageUrls,
      });

      toast.success('Images applied to content!');
    },
  });

  // Handle streaming content updates
  const handleContentStreaming = useCallback(
    (text: string) => {
      console.log('[PageEditorScreen] handleContentStreaming', { textLength: text.length });
      updateGeneratedContent({ text, images: generatedContent.images });
    },
    [updateGeneratedContent, generatedContent.images]
  );

  // Handle final content
  const handleContentGenerated = useCallback(
    async (content: { text: string; images: string[] }) => {
      console.log('[PageEditorScreen] handleContentGenerated', { textLength: content.text.length });
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
    onTitleSuggested: updateTitle,
    currentContent: generatedContent.text || undefined,
    currentTitle: page?.title,
    imageStyle: styleSettings.selectedStyle, // Pass style directly to avoid sync issues
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
      onTitleChange: updateTitle,
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
          // User approved - start the image generation modal
          isImagePlanningRef.current = false;
          addMessage('assistant', "Great! Opening the image generator. I'll create 3 variations for each placement so you can choose your favorites.");

          // Get recommendations and start modal generation
          const recommendations = getRecommendationsForModal();
          const brandColors = companySettings.colors
            ? {
                primary: companySettings.colors.primary,
                secondary: companySettings.colors.secondary,
                accent: companySettings.colors.accent,
              }
            : undefined;

          console.log('[PageEditorScreen] Starting image generation with style:', styleSettings.selectedStyle);
          imageModal.startGeneration(
            recommendations,
            styleSettings.selectedStyle,
            brandColors
          );
        }
      }
      return;
    }

    // Normal chat flow
    setIsGenerating(true);
    sendMessage(message, attachments);
    setTimeout(() => setIsGenerating(false), 1500);
  }, [imagePlanState, sendPlanMessage, generatedContent.text, getRecommendationsForModal, companySettings.colors, styleSettings.selectedStyle, imageModal, addMessage, setIsGenerating, sendMessage]);

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

  // Determine if we're loading images (either modal generating or legacy flow)
  const isGeneratingImages = imageModal.isLoading || isGeneratingImagesLegacy;

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
            onStyleChange={handleStyleChange}
            contentBlocks={blocks}
            onReorderBlocks={reorderBlocks}
            onDeleteBlock={deleteBlock}
            isGeneratingImages={isGeneratingImages}
          />
        </div>
      </div>

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        prompt={imageModal.placements[0]?.description || 'Generating images...'}
        progress={imageModal.progress}
        isLoading={imageModal.isLoading}
        isGeneratingMore={imageModal.isGeneratingMore}
        hasGeneratedImages={imageModal.placements.some((p) => p.images.some((i) => i.url))}
      >
        <ImageSelectionGrid
          placements={imageModal.placements}
          selectedImages={imageModal.selectedImages}
          skippedPlacements={imageModal.skippedPlacements}
          onSelectImage={imageModal.selectImage}
          onSkipPlacement={imageModal.skipPlacement}
          onRegenerate={(placementId) => {
            const placement = imageModal.placements.find((p) => p.id === placementId);
            imageModal.openRegenerate(placementId, null);
            // Store placement type for the popover
            if (placement) {
              // The popover will use this data
            }
          }}
          onImageClick={imageModal.openLightbox}
          onEditClick={(placementId, imageId) => imageModal.openEdit(imageId, placementId)}
          onApply={imageModal.applyImages}
          onCancel={imageModal.closeModal}
        />
      </ImageGenerationModal>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={imageModal.modalState === 'lightbox'}
        images={imageModal.lightboxImages}
        currentImageId={imageModal.currentLightboxId || ''}
        selectedImages={imageModal.selectedImages}
        onClose={imageModal.closeLightbox}
        onNavigate={imageModal.navigateLightbox}
        onSelect={imageModal.selectImage}
        onEdit={imageModal.openEdit}
        onRegenerate={(placementId) => imageModal.openRegenerate(placementId, null)}
      />

      {/* Edit Panel */}
      <EditImagePanel
        isOpen={imageModal.modalState === 'editing'}
        referenceImage={imageModal.editingImage}
        onSubmit={imageModal.submitEdit}
        onClose={imageModal.closeEdit}
        isLoading={imageModal.isEditLoading}
        error={imageModal.editError}
      />

      {/* Regenerate Popover */}
      {imageModal.regenerateData && (
        <RegeneratePopover
          isOpen={true}
          anchorRect={imageModal.regenerateData.anchorRect}
          placementId={imageModal.regenerateData.placementId}
          placementType={
            imageModal.placements.find((p) => p.id === imageModal.regenerateData?.placementId)
              ?.type || 'body'
          }
          currentPrompt={
            imageModal.placements.find((p) => p.id === imageModal.regenerateData?.placementId)
              ?.description || ''
          }
          onRegenerate={imageModal.regeneratePlacement}
          onClose={imageModal.closeRegenerate}
        />
      )}

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
