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
  InlineImageEditModal,
} from '@/components/modals';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';
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
  // State for inline image editing modal
  const [editingInlineImage, setEditingInlineImage] = useState<string | null>(null);

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
    addBlock,
    updateBlock,
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
      const allBlocks = [...headerBlocks, textBlock, ...bodyBlocks];
      setAllBlocks(allBlocks);

      // IMPORTANT: Save BOTH flat image URLs AND full contentBlocks for persistence
      const imageUrls = imageBlocks
        .filter((b): b is ContentBlock & { type: 'image' } => b.type === 'image')
        .map((b) => b.imageUrl);

      updateGeneratedContent({
        text: generatedContent?.text || '',
        images: imageUrls,
        contentBlocks: allBlocks, // Save full blocks with placement info
      });

      toast.success('Images applied to content!');
    },
  });

  // Restore content blocks from saved page on load
  useEffect(() => {
    if (generatedContent.contentBlocks && generatedContent.contentBlocks.length > 0 && blocks.length === 0) {
      console.log('[PageEditorScreen] Restoring content blocks from saved page', {
        blockCount: generatedContent.contentBlocks.length,
      });
      setAllBlocks(generatedContent.contentBlocks);
    }
  }, [generatedContent.contentBlocks, blocks.length, setAllBlocks]);

  // Handle streaming content updates
  const handleContentStreaming = useCallback(
    (text: string) => {
      // Update text but preserve images and blocks
      const updatedBlocks = blocks.length > 0
        ? blocks.map(b => b.type === 'text' ? { ...b, content: text } : b)
        : generatedContent.contentBlocks;

      updateGeneratedContent({
        text,
        images: generatedContent.images,
        contentBlocks: updatedBlocks,
      });

      // Also sync to content blocks if they exist (keeps header/body images intact)
      const textBlock = blocks.find((b) => b.type === 'text');
      if (textBlock) {
        updateBlock(textBlock.id, { content: text });
      }
    },
    [updateGeneratedContent, generatedContent.images, generatedContent.contentBlocks, blocks, updateBlock]
  );

  // Handle final content
  const handleContentGenerated = useCallback(
    async (content: { text: string; images: string[] }) => {
      // Preserve existing contentBlocks, just update the text in them
      const updatedBlocks = blocks.length > 0
        ? blocks.map(b => b.type === 'text' ? { ...b, content: content.text } : b)
        : generatedContent.contentBlocks;

      updateGeneratedContent({
        text: content.text,
        images: generatedContent.images, // Keep existing images
        contentBlocks: updatedBlocks,
      });

      // Also sync to content blocks if they exist
      const textBlock = blocks.find((b) => b.type === 'text');
      if (textBlock) {
        updateBlock(textBlock.id, { content: content.text });
      }
    },
    [updateGeneratedContent, generatedContent.images, generatedContent.contentBlocks, blocks, updateBlock]
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

  // Handle approving image plan via the "Go" button
  const handleApproveImagePlan = useCallback(async () => {
    if (!isImagePlanningRef.current || imagePlanState !== 'planning') return;

    // Add user approval message to chat
    addMessage('user', 'Go ahead!');

    // Send approval to planning flow
    const result = await sendPlanMessage(generatedContent.text, 'go ahead');

    if (result) {
      // Add AI response
      addMessage('assistant', result.message);

      if (result.isApproval) {
        // Start image generation
        isImagePlanningRef.current = false;
        addMessage('assistant', "Great! Opening the image generator. I'll create 3 variations for each placement so you can choose your favorites.");

        const recommendations = getRecommendationsForModal();
        const brandColors = companySettings.colors
          ? {
              primary: companySettings.colors.primary,
              secondary: companySettings.colors.secondary,
              accent: companySettings.colors.accent,
            }
          : undefined;

        imageModal.startGeneration(
          recommendations,
          styleSettings.selectedStyle,
          brandColors
        );
      }
    }
  }, [imagePlanState, sendPlanMessage, generatedContent.text, getRecommendationsForModal, companySettings.colors, styleSettings.selectedStyle, imageModal, addMessage]);

  // Handle selecting an inline image to add to content blocks
  const handleSelectInlineImage = useCallback((imageUrl: string) => {
    const newImageBlock: ContentBlock = {
      type: 'image',
      id: `img_inline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      aspectRatio: '16:9', // Default for inline images
      placementType: 'body',
    };
    addBlock(newImageBlock);
    toast.success('Image added to content');
  }, [addBlock]);

  // Handle opening the edit modal for an inline image
  const handleEditInlineImage = useCallback((imageUrl: string) => {
    setEditingInlineImage(imageUrl);
  }, []);

  // Handle submitting an inline image edit
  const handleSubmitInlineEdit = useCallback(async (editPrompt: string): Promise<string | null> => {
    if (!editingInlineImage) return null;

    try {
      // Extract base64 from data URL if present
      const base64Data = editingInlineImage.startsWith('data:')
        ? editingInlineImage.split(',')[1]
        : editingInlineImage;

      const result = await apiClient.editImage({
        referenceImage: base64Data,
        editPrompt,
        aspectRatio: '16:9',
        placementType: 'body',
      });

      if (result.success && result.data) {
        const newImageUrl = `data:${result.data.mimeType};base64,${result.data.base64Data}`;

        // Add the edited image to the current assistant message
        // Find the last assistant message and append the new image
        setMessages((prev) => {
          const lastAssistantIndex = prev.findIndex((m, i) =>
            m.role === 'assistant' && i === prev.length - 1
          );
          if (lastAssistantIndex === -1) {
            // If no assistant message exists, create a new one with the image
            return [
              ...prev,
              {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant' as const,
                content: 'Here\'s your edited image:',
                timestamp: new Date(),
                images: [newImageUrl],
              },
            ];
          }

          // Add to existing last assistant message's images
          return prev.map((msg, idx) => {
            if (idx === prev.length - 1 && msg.role === 'assistant') {
              return {
                ...msg,
                images: [...(msg.images || []), newImageUrl],
              };
            }
            return msg;
          });
        });

        return newImageUrl;
      }

      return null;
    } catch (error) {
      console.error('Failed to edit image:', error);
      throw error;
    }
  }, [editingInlineImage, setMessages]);

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
            onSelectImage={handleSelectInlineImage}
            onEditImage={handleEditInlineImage}
            onNavigateToStyle={() => onNavigate('style')}
            onStyleChange={handleStyleChange}
            isImagePlanning={imagePlanState === 'planning'}
            onApproveImagePlan={handleApproveImagePlan}
          />
        </div>

        {/* Preview Pane - 60% */}
        <div className="flex-1">
          <PreviewPane
            content={generatedContent}
            isGenerating={isGenerating}
            onNavigateToVoice={() => onNavigate('voice')}
            onRegenerate={handleGenerateImages}
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

      {/* Inline Image Edit Modal */}
      <InlineImageEditModal
        isOpen={!!editingInlineImage}
        imageUrl={editingInlineImage}
        onSubmit={handleSubmitInlineEdit}
        onClose={() => setEditingInlineImage(null)}
      />

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
