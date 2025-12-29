import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, FileAttachment } from '@/types/page';
import { apiClient, CompanyProfile } from '@/services/api';
import { useCompanySettings } from './useCompanySettings';
import { useVoiceSettings } from './useVoiceSettings';
import { useStyleSettings } from './useStyleSettings';

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  onContentGenerated?: (content: { text: string; images: string[] }) => void;
}

export const useChat = ({ initialMessages = [], onContentGenerated }: UseChatOptions = {}) => {
  const { settings: companySettings } = useCompanySettings();
  const { settings: voiceSettings } = useVoiceSettings();
  const { settings: styleSettings } = useStyleSettings();

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: generateMessageId(),
            role: 'assistant',
            content:
              'What content would you like to create today? You can describe what you need, paste a URL, or upload a file.',
            timestamp: new Date(),
          },
        ]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track current assistant message ID for streaming updates
  const currentAssistantMessageId = useRef<string | null>(null);

  /**
   * Process file attachments and return their content as source materials
   */
  const processAttachments = async (attachments: FileAttachment[]): Promise<string[]> => {
    const sourceMaterials: string[] = [];

    for (const attachment of attachments) {
      try {
        // We need the actual File object, not just the metadata
        // This assumes attachments include a way to get the file content
        // For now, we'll add a placeholder - the UI component should pass File objects
        sourceMaterials.push(`[Attached file: ${attachment.name}]`);
      } catch (err) {
        console.error(`Failed to process attachment ${attachment.name}:`, err);
      }
    }

    return sourceMaterials;
  };

  /**
   * Build company profile for the API request
   */
  const buildCompanyProfile = (): CompanyProfile => ({
    websiteUrl: companySettings.url || '',
    companyProfile: `${companySettings.name}${companySettings.industry ? ` - ${companySettings.industry}` : ''}. ${companySettings.description}`,
    brandColors: {
      primary: companySettings.colors.primary,
      secondary: companySettings.colors.secondary,
      accent: companySettings.colors.accent,
    },
  });

  /**
   * Send a message and get AI response with streaming
   */
  const sendMessage = useCallback(
    async (content: string, attachments?: FileAttachment[]) => {
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create assistant message placeholder for streaming
      const assistantMessageId = generateMessageId();
      currentAssistantMessageId.current = assistantMessageId;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Process any file attachments
        const sourceMaterials = attachments?.length
          ? await processAttachments(attachments)
          : undefined;

        // Build request with current settings
        const request = {
          objective: content,
          companyProfile: buildCompanyProfile(),
          voiceSettings: {
            formality: voiceSettings.formality,
            humor: voiceSettings.humor,
            respect: voiceSettings.respect,
            enthusiasm: voiceSettings.enthusiasm,
          },
          imageStyle: styleSettings.selectedStyle,
          sourceMaterials,
        };

        let fullText = '';

        // Stream the response
        await apiClient.generateTextStream(
          request,
          // onChunk - update message as chunks arrive
          (chunk: string) => {
            fullText += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
              )
            );
          },
          // onComplete
          (finalText: string) => {
            setIsLoading(false);
            currentAssistantMessageId.current = null;

            // Notify about generated content
            if (onContentGenerated) {
              onContentGenerated({
                text: finalText,
                images: [], // Images are generated separately
              });
            }
          },
          // onError
          (err: Error) => {
            console.error('Chat API error:', err);
            setError(err.message);
            setIsLoading(false);
            currentAssistantMessageId.current = null;

            // Update assistant message with error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
                    }
                  : msg
              )
            );
          }
        );
      } catch (err) {
        console.error('Chat error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setIsLoading(false);
        currentAssistantMessageId.current = null;

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
              : msg
          )
        );
      }
    },
    [companySettings, voiceSettings, styleSettings, onContentGenerated]
  );

  /**
   * Send a message with actual File objects for processing
   */
  const sendMessageWithFiles = useCallback(
    async (content: string, files: File[]) => {
      setError(null);

      // Create file attachments metadata
      const attachments: FileAttachment[] = files.map((file) => ({
        id: generateMessageId(),
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create assistant message placeholder
      const assistantMessageId = generateMessageId();
      currentAssistantMessageId.current = assistantMessageId;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Process files and extract content
        const sourceMaterials: string[] = [];
        for (const file of files) {
          try {
            const result = await apiClient.processFile(file);
            if (result.success && result.data) {
              if (result.data.type === 'text' && result.data.text) {
                sourceMaterials.push(`[Content from ${file.name}]:\n${result.data.text}`);
              } else if (result.data.type === 'document' && result.data.preview) {
                sourceMaterials.push(`[Content from ${file.name}]:\n${result.data.preview}`);
              }
            }
          } catch (err) {
            console.error(`Failed to process file ${file.name}:`, err);
            sourceMaterials.push(`[Failed to process ${file.name}]`);
          }
        }

        // Build request with current settings
        const request = {
          objective: content,
          companyProfile: buildCompanyProfile(),
          voiceSettings: {
            formality: voiceSettings.formality,
            humor: voiceSettings.humor,
            respect: voiceSettings.respect,
            enthusiasm: voiceSettings.enthusiasm,
          },
          imageStyle: styleSettings.selectedStyle,
          sourceMaterials: sourceMaterials.length > 0 ? sourceMaterials : undefined,
        };

        let fullText = '';

        // Stream the response
        await apiClient.generateTextStream(
          request,
          (chunk: string) => {
            fullText += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
              )
            );
          },
          (finalText: string) => {
            setIsLoading(false);
            currentAssistantMessageId.current = null;
            if (onContentGenerated) {
              onContentGenerated({ text: finalText, images: [] });
            }
          },
          (err: Error) => {
            console.error('Chat API error:', err);
            setError(err.message);
            setIsLoading(false);
            currentAssistantMessageId.current = null;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: `Sorry, I encountered an error: ${err.message}. Please try again.` }
                  : msg
              )
            );
          }
        );
      } catch (err) {
        console.error('Chat error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setIsLoading(false);
        currentAssistantMessageId.current = null;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
              : msg
          )
        );
      }
    },
    [companySettings, voiceSettings, styleSettings, onContentGenerated]
  );

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: generateMessageId(),
        role: 'assistant',
        content:
          'What content would you like to create today? You can describe what you need, paste a URL, or upload a file.',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendMessageWithFiles,
    addSystemMessage,
    clearMessages,
    setMessages,
  };
};
