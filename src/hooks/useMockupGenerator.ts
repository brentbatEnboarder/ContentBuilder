import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import type { MockupTemplate, MockupResult } from '@/types/mockup';
import type { ContentBlock } from '@/types/content';

// iPhone 14/15 actual pixel dimensions (1170 x 2532)
// This is the native resolution for a sharp mockup
const RENDER_WIDTH = 1170;
const RENDER_HEIGHT = 2532;
// Scale factor (3x retina)
const SCALE_FACTOR = 3;

interface ContentData {
  text: string;
  contentBlocks?: ContentBlock[];
}

interface UseMockupGeneratorResult {
  // Modal states
  isSelectionOpen: boolean;
  isResultsOpen: boolean;
  isEditOpen: boolean;
  // Loading states
  isCapturing: boolean;
  isGenerating: boolean;
  isEditing: boolean;
  loadingProgress: number;
  // Results
  results: MockupResult[];
  selectedTemplate: MockupTemplate | null;
  editingMockup: MockupResult | null;
  // Actions
  openSelection: () => void;
  closeSelection: () => void;
  closeResults: () => void;
  generateMockup: (template: MockupTemplate, content: ContentData) => Promise<void>;
  deleteMockup: (mockupId: string) => void;
  openEdit: (mockup: MockupResult) => void;
  closeEdit: () => void;
  submitEdit: (editPrompt: string) => Promise<string | null>;
  // Test function to preview the captured screenshot
  testCapture: (content: ContentData) => Promise<void>;
}

export function useMockupGenerator(): UseMockupGeneratorResult {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [results, setResults] = useState<MockupResult[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [editingMockup, setEditingMockup] = useState<MockupResult | null>(null);

  // Ref to track if generation is in progress (prevents double-clicks)
  const isGeneratingRef = useRef(false);

  const openSelection = useCallback(() => {
    setIsSelectionOpen(true);
  }, []);

  const closeSelection = useCallback(() => {
    setIsSelectionOpen(false);
  }, []);

  const closeResults = useCallback(() => {
    setIsResultsOpen(false);
    setResults([]);
    setLoadingProgress(0);
  }, []);

  /**
   * Create a mobile-width render of the content and capture it as PNG
   *
   * This creates a hidden element at logical mobile width (390px), renders the content
   * with proper mobile layout (text reflows, images scale), then captures at 3x
   * to produce a crisp 1170x2532 iPhone-resolution image.
   */
  const captureContent = useCallback(async (content: ContentData): Promise<string> => {
    const logicalWidth = RENDER_WIDTH / SCALE_FACTOR; // 390px
    console.log(`[Mockup] Creating mobile render at ${logicalWidth}px logical width, output ${RENDER_WIDTH}x${RENDER_HEIGHT}`);

    // Get header image from content blocks if available
    const headerImageBlock = content.contentBlocks?.find(
      (b): b is ContentBlock & { type: 'image' } => b.type === 'image' && b.placementType === 'header'
    );

    // Create a hidden container for mobile rendering at logical width
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${logicalWidth}px;
      height: auto;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-weight: 300;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    try {
      // Build the HTML content
      let html = '';

      // Header image (full width)
      if (headerImageBlock?.imageUrl) {
        html += `
          <div style="width: 100%; overflow: hidden;">
            <img
              src="${headerImageBlock.imageUrl}"
              alt="Header"
              style="width: 100%; height: auto; display: block; object-fit: cover;"
              crossorigin="anonymous"
            />
          </div>
        `;
      }

      // Content text (clean, no card styling)
      if (content.text) {
        // Simple markdown-to-HTML conversion for common elements
        let formattedText = content.text
          // Escape HTML first
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          // Headers - first header gets less top margin if immediately after image
          .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 600; margin: 12px 0 8px 0; color: #1a1a1a;">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 600; margin: 14px 0 10px 0; color: #1a1a1a;">$1</h2>')
          .replace(/^# (.+)$/gm, '<h1 style="font-size: 22px; font-weight: 600; margin: 16px 0 12px 0; color: #1a1a1a;">$1</h1>')
          // Bold and italic
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          // Bullet points
          .replace(/^- (.+)$/gm, '<li style="margin-left: 16px; margin-bottom: 4px; font-weight: 300;">$1</li>')
          // Line breaks
          .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6; color: #374151; font-weight: 300;">')
          .replace(/\n/g, '<br/>');

        // Wrap in paragraph if not starting with HTML tag
        if (!formattedText.startsWith('<')) {
          formattedText = `<p style="margin: 10px 0; line-height: 1.6; color: #374151; font-weight: 300;">${formattedText}</p>`;
        }

        html += `
          <div style="padding: 12px 16px; font-size: 14px; color: #374151; font-weight: 300;">
            ${formattedText}
          </div>
        `;
      }

      container.innerHTML = html;

      // Wait for images to load
      const images = container.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) {
                  resolve();
                } else {
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // Don't block on error
                }
              })
          )
        );
      }

      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the rendered content at 3x scale for retina quality
      const canvas = await html2canvas(container, {
        scale: SCALE_FACTOR, // 3x for iPhone retina
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: logicalWidth,
        height: Math.min(container.scrollHeight, RENDER_HEIGHT / SCALE_FACTOR * 1.5), // Capture more than we need
      });

      console.log(`[Mockup] Captured canvas size: ${canvas.width}x${canvas.height}`);

      // Create final canvas at exact iPhone pixel dimensions (1170 x 2532)
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = RENDER_WIDTH;
      finalCanvas.height = RENDER_HEIGHT;

      const ctx = finalCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

      // Draw captured content (already at correct scale from html2canvas)
      const sourceHeight = Math.min(canvas.height, RENDER_HEIGHT);
      ctx.drawImage(
        canvas,
        0, 0, RENDER_WIDTH, sourceHeight,  // Source
        0, 0, RENDER_WIDTH, sourceHeight   // Dest
      );

      console.log(`[Mockup] Final canvas size: ${finalCanvas.width}x${finalCanvas.height}`);

      // Convert to base64
      return finalCanvas.toDataURL('image/png').split(',')[1];
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }, []);

  /**
   * Test the capture by downloading the result as a PNG
   * This lets us verify the mobile render is correct before sending to Gemini
   */
  const testCapture = useCallback(async (content: ContentData) => {
    try {
      toast.info('Creating mobile render preview...');
      const base64 = await captureContent(content);

      // Create a download link
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${base64}`;
      link.download = `mockup-preview-${RENDER_WIDTH}x${RENDER_HEIGHT}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded preview (${RENDER_WIDTH}x${RENDER_HEIGHT})`);
    } catch (error) {
      console.error('Test capture error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to capture');
    }
  }, [captureContent]);

  /**
   * Load an image and convert to base64
   */
  const loadImageAsBase64 = useCallback(async (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      img.src = imagePath;
    });
  }, []);

  /**
   * Generate mockups using the selected template and content data
   */
  const generateMockup = useCallback(async (
    template: MockupTemplate,
    content: ContentData
  ) => {
    // Prevent double-clicks
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    setSelectedTemplate(template);
    setIsCapturing(true);
    setIsSelectionOpen(false);
    setIsResultsOpen(true);
    setResults([]);
    setLoadingProgress(0);

    try {
      // Step 1: Create mobile render and capture as PNG
      toast.info('Creating mobile preview...');
      const contentBase64 = await captureContent(content);
      setIsCapturing(false);
      setLoadingProgress(10);

      // Step 2: Load mockup template as base64
      const mockupBase64 = await loadImageAsBase64(template.imagePath);
      setLoadingProgress(20);

      // Step 3: Call backend to generate mockup
      setIsGenerating(true);
      toast.info('Generating mockup... This may take up to 30 seconds.');

      const response = await apiClient.generateMockup({
        mockupTemplateBase64: mockupBase64,
        contentScreenshotBase64: contentBase64,
        templateName: template.name,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate mockup');
      }

      // Convert response to MockupResult format
      const mockupResults: MockupResult[] = response.data.images.map((img, index) => ({
        id: `mockup_${Date.now()}_${index}`,
        imageUrl: `data:${img.mimeType};base64,${img.base64Data}`,
        templateId: template.id,
      }));

      setResults(mockupResults);
      setLoadingProgress(100);
      toast.success('Mockup generated!');

    } catch (error) {
      console.error('Mockup generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate mockups');
      setIsResultsOpen(false);
    } finally {
      setIsCapturing(false);
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [captureContent, loadImageAsBase64]);

  // Delete a mockup from results
  const deleteMockup = useCallback((mockupId: string) => {
    setResults((prev) => {
      const newResults = prev.filter((r) => r.id !== mockupId);
      // If no results left, close the modal
      if (newResults.length === 0) {
        setIsResultsOpen(false);
        toast.info('Mockup deleted');
      }
      return newResults;
    });
  }, []);

  // Open edit modal for a mockup
  const openEdit = useCallback((mockup: MockupResult) => {
    setEditingMockup(mockup);
    setIsEditOpen(true);
  }, []);

  // Close edit modal
  const closeEdit = useCallback(() => {
    setIsEditOpen(false);
    setEditingMockup(null);
  }, []);

  // Submit edit - regenerate mockup with edit prompt
  const submitEdit = useCallback(async (editPrompt: string): Promise<string | null> => {
    if (!editingMockup) return null;

    setIsEditing(true);
    try {
      // Extract base64 from data URL
      const base64Data = editingMockup.imageUrl.split(',')[1];

      const result = await apiClient.editImage({
        referenceImage: base64Data,
        editPrompt,
        aspectRatio: '16:9', // Landscape for mockups
        placementType: 'body',
      });

      if (result.success && result.data) {
        const newImageUrl = `data:${result.data.mimeType};base64,${result.data.base64Data}`;

        // Replace the edited mockup in results
        setResults((prev) =>
          prev.map((r) =>
            r.id === editingMockup.id
              ? { ...r, imageUrl: newImageUrl }
              : r
          )
        );

        toast.success('Mockup updated!');
        closeEdit();
        return newImageUrl;
      } else {
        throw new Error(result.error || 'Failed to edit mockup');
      }
    } catch (error) {
      console.error('Edit mockup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to edit mockup');
      return null;
    } finally {
      setIsEditing(false);
    }
  }, [editingMockup, closeEdit]);

  return {
    isSelectionOpen,
    isResultsOpen,
    isEditOpen,
    isCapturing,
    isGenerating,
    isEditing,
    loadingProgress,
    results,
    selectedTemplate,
    editingMockup,
    openSelection,
    closeSelection,
    closeResults,
    generateMockup,
    deleteMockup,
    openEdit,
    closeEdit,
    submitEdit,
    testCapture,
  };
}
