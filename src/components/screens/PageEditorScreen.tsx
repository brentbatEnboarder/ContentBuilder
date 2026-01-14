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
import { useMockupGenerator } from '@/hooks/useMockupGenerator';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
import { useNavigationGuard, useRegisterNavigationGuard } from '@/contexts/NavigationGuardContext';
import { Button } from '@/components/ui/button';
import {
  ImageGenerationModal,
  ImageSelectionGrid,
  ImageLightbox,
  EditImagePanel,
  RegeneratePopover,
  InlineImageEditModal,
  MockupSelectionModal,
  MockupResultsModal,
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
  const [isSaving, setIsSaving] = useState(false);
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

  // Content blocks (used for image generation modal)
  const {
    blocks,
    setAllBlocks,
    addBlock,
    deleteBlock,
  } = useContentBlocks();

  // State for editing content block images
  const [editingImageBlock, setEditingImageBlock] = useState<(ContentBlock & { type: 'image' }) | null>(null);

  // Image planning hook (conversational flow)
  const {
    state: imagePlanState,
    isPlanningLoading,
    isGenerating: isGeneratingImagesLegacy,
    startPlanning,
    sendPlanMessage,
  } = useImagePlanning();

  // Mockup generator hook
  const mockupGenerator = useMockupGenerator();

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
      updateGeneratedContent({
        text,
        images: generatedContent.images,
        contentBlocks: generatedContent.contentBlocks,
      });
    },
    [updateGeneratedContent, generatedContent.images, generatedContent.contentBlocks]
  );

  // Handle final content
  const handleContentGenerated = useCallback(
    async (content: { text: string; images: string[] }) => {
      updateGeneratedContent({
        text: content.text,
        images: generatedContent.images, // Keep existing images
        contentBlocks: generatedContent.contentBlocks,
      });
    },
    [updateGeneratedContent, generatedContent.images, generatedContent.contentBlocks]
  );

  const {
    messages,
    isLoading,
    sendMessage,
    sendMessageWithFiles,
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
    setIsSaving(true);
    try {
      await save();
      setShowSaved(true);
      toast.success('Page saved successfully');
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      toast.error('Failed to save page');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [save]);

  // Save callback for navigation guard (saves without showing toast for cleaner UX)
  const saveForNavigation = useCallback(async () => {
    setIsSaving(true);
    try {
      await save();
    } finally {
      setIsSaving(false);
    }
  }, [save]);

  // Register navigation guard to handle "New Page" with unsaved changes
  const { pendingAction, confirmSave, confirmDiscard, cancelNavigation } = useNavigationGuard();
  useRegisterNavigationGuard(isDirty, saveForNavigation);

  // Register header actions
  useRegisterHeaderActions(
    isDirty,
    isSaving,
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

  const handleSendMessage = useCallback(async (message: string, attachments?: FileAttachment[], files?: File[]) => {
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

          // Use recommendations from result (fresh data), NOT getRecommendationsForModal() (stale state)
          const brandColors = companySettings.colors
            ? {
                primary: companySettings.colors.primary,
                secondary: companySettings.colors.secondary,
                accent: companySettings.colors.accent,
              }
            : undefined;

          console.log('[PageEditorScreen] Starting image generation with', result.recommendations.length, 'recommendations, style:', styleSettings.selectedStyle);
          imageModal.startGeneration(
            result.recommendations,
            styleSettings.selectedStyle,
            brandColors
          );
        }
      }
      return;
    }

    // Normal chat flow
    setIsGenerating(true);
    // Use sendMessageWithFiles when files are present to actually process file content
    if (files && files.length > 0) {
      sendMessageWithFiles(message, files);
    } else {
      sendMessage(message, attachments);
    }
    setTimeout(() => setIsGenerating(false), 1500);
  }, [imagePlanState, sendPlanMessage, generatedContent.text, companySettings.colors, styleSettings.selectedStyle, imageModal, addMessage, setIsGenerating, sendMessage, sendMessageWithFiles]);

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

  // Handle regenerating text content with current settings
  const handleRegenerateText = useCallback(() => {
    if (!generatedContent.text) {
      toast.error('No content to regenerate');
      return;
    }

    // Send a regenerate request through the chat
    setIsGenerating(true);
    sendMessage('Please regenerate this content with a fresh take, keeping the same topic and structure but improving the writing.');
    setTimeout(() => setIsGenerating(false), 1500);
  }, [generatedContent.text, setIsGenerating, sendMessage]);

  // Handle inline text editing from ContentPreview
  const handleTextChange = useCallback((newText: string) => {
    updateGeneratedContent({
      text: newText,
      images: generatedContent.images,
      contentBlocks: generatedContent.contentBlocks,
    });
  }, [updateGeneratedContent, generatedContent.images, generatedContent.contentBlocks]);

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

        // Use recommendations from result (fresh data), NOT getRecommendationsForModal() (stale state)
        const brandColors = companySettings.colors
          ? {
              primary: companySettings.colors.primary,
              secondary: companySettings.colors.secondary,
              accent: companySettings.colors.accent,
            }
          : undefined;

        console.log('[PageEditorScreen] Button: Starting image generation with', result.recommendations.length, 'recommendations');
        imageModal.startGeneration(
          result.recommendations,
          styleSettings.selectedStyle,
          brandColors
        );
      }
    }
  }, [imagePlanState, sendPlanMessage, generatedContent.text, companySettings.colors, styleSettings.selectedStyle, imageModal, addMessage]);

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

  // Handle editing an image block (header/body images in preview)
  const handleEditImageBlock = useCallback((block: ContentBlock & { type: 'image' }) => {
    setEditingImageBlock(block);
  }, []);

  // Handle submitting an image block edit
  const handleSubmitImageBlockEdit = useCallback(async (editPrompt: string): Promise<string | null> => {
    if (!editingImageBlock) return null;

    try {
      const base64Data = editingImageBlock.imageUrl.startsWith('data:')
        ? editingImageBlock.imageUrl.split(',')[1]
        : editingImageBlock.imageUrl;

      const result = await apiClient.editImage({
        referenceImage: base64Data,
        editPrompt,
        aspectRatio: editingImageBlock.aspectRatio || '16:9',
        placementType: editingImageBlock.placementType || 'body',
      });

      if (result.success && result.data) {
        const newImageUrl = `data:${result.data.mimeType};base64,${result.data.base64Data}`;

        // Update the block in content blocks
        const updatedBlocks = blocks.map((b) =>
          b.id === editingImageBlock.id && b.type === 'image'
            ? { ...b, imageUrl: newImageUrl }
            : b
        );
        setAllBlocks(updatedBlocks);

        // Also update generatedContent
        updateGeneratedContent({
          text: generatedContent.text,
          images: generatedContent.images.map((img) =>
            img === editingImageBlock.imageUrl ? newImageUrl : img
          ),
          contentBlocks: updatedBlocks,
        });

        toast.success('Image updated!');
        setEditingImageBlock(null);
        return newImageUrl;
      }

      return null;
    } catch (error) {
      console.error('Failed to edit image:', error);
      throw error;
    }
  }, [editingImageBlock, blocks, setAllBlocks, updateGeneratedContent, generatedContent.text, generatedContent.images]);

  // Handle deleting an image block
  const handleDeleteImageBlock = useCallback((blockId: string) => {
    deleteBlock(blockId);

    // Also update generatedContent
    const updatedBlocks = generatedContent.contentBlocks?.filter((b) => b.id !== blockId) || [];
    const deletedBlock = generatedContent.contentBlocks?.find((b) => b.id === blockId);
    const updatedImages = deletedBlock?.type === 'image'
      ? generatedContent.images.filter((img) => img !== (deletedBlock as ContentBlock & { type: 'image' }).imageUrl)
      : generatedContent.images;

    updateGeneratedContent({
      text: generatedContent.text,
      images: updatedImages,
      contentBlocks: updatedBlocks,
    });

    toast.success('Image deleted');
  }, [deleteBlock, generatedContent, updateGeneratedContent]);

  // Handle opening mockup selection modal
  const handleOpenMockup = useCallback(() => {
    if (!generatedContent.text) {
      toast.error('No content to create mockup from');
      return;
    }
    mockupGenerator.openSelection();
  }, [generatedContent.text, mockupGenerator]);

  // Handle mockup template selection
  const handleMockupSelect = useCallback(async (template: { id: string; name: string; imagePath: string; description: string }) => {
    await mockupGenerator.generateMockup(template, {
      text: generatedContent.text,
      contentBlocks: generatedContent.contentBlocks,
    });
  }, [mockupGenerator, generatedContent.text, generatedContent.contentBlocks]);

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
            onRegenerate={handleRegenerateText}
            onTextChange={handleTextChange}
            onMockup={handleOpenMockup}
            isGeneratingImages={isGeneratingImages}
            onEditImageBlock={handleEditImageBlock}
            onDeleteImageBlock={handleDeleteImageBlock}
            pageTitle={page?.title || 'Untitled'}
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
          onRegenerate={(placementId, _styleId) => {
            // styleId is passed but we open the popover which has its own style selector
            // The popover reads the current style when user clicks regenerate
            imageModal.openRegenerate(placementId, null);
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

      {/* Image Block Edit Modal (for header/body images) */}
      <InlineImageEditModal
        isOpen={!!editingImageBlock}
        imageUrl={editingImageBlock?.imageUrl || null}
        onSubmit={handleSubmitImageBlockEdit}
        onClose={() => setEditingImageBlock(null)}
      />

      {/* Mockup Selection Modal */}
      <MockupSelectionModal
        isOpen={mockupGenerator.isSelectionOpen}
        onClose={mockupGenerator.closeSelection}
        onSelect={handleMockupSelect}
        isLoading={mockupGenerator.isCapturing}
      />

      {/* Mockup Results Modal */}
      <MockupResultsModal
        isOpen={mockupGenerator.isResultsOpen}
        onClose={mockupGenerator.closeResults}
        results={mockupGenerator.results}
        isLoading={mockupGenerator.isGenerating}
        loadingProgress={mockupGenerator.loadingProgress}
        templateName={mockupGenerator.selectedTemplate?.name}
        onEdit={mockupGenerator.openEdit}
        onDelete={mockupGenerator.deleteMockup}
      />

      {/* Mockup Edit Modal */}
      <InlineImageEditModal
        isOpen={mockupGenerator.isEditOpen}
        imageUrl={mockupGenerator.editingMockup?.imageUrl || null}
        onSubmit={mockupGenerator.submitEdit}
        onClose={mockupGenerator.closeEdit}
      />

      {/* Discard Changes Dialog (for back button) */}
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

      {/* Unsaved Changes Dialog (for New Page navigation) */}
      <AlertDialog open={pendingAction === 'new-page'} onOpenChange={(open) => !open && cancelNavigation()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this page. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelNavigation}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDiscard}
            >
              Discard
            </Button>
            <Button
              onClick={async () => {
                await confirmSave();
                toast.success('Page saved successfully');
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
