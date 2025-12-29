import { useState, useCallback, useMemo } from 'react';

const URL_REGEX = /^(https?:\/\/[^\s]+)$/i;

export const useInputDetection = (value: string) => {
  const detectedUrl = useMemo(() => {
    const trimmed = value.trim();
    if (URL_REGEX.test(trimmed)) {
      return trimmed;
    }
    // Also check if the input contains a URL
    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
    return urlMatch ? urlMatch[1] : null;
  }, [value]);

  const hasUrl = Boolean(detectedUrl);

  return {
    detectedUrl,
    hasUrl,
  };
};

export const useFileDropzone = () => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((
    e: React.DragEvent,
    onFilesDropped: (files: File[]) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      return validTypes.includes(file.type) || 
        file.name.endsWith('.pdf') || 
        file.name.endsWith('.docx') || 
        file.name.endsWith('.doc') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.pptx');
    });

    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  }, []);

  return {
    isDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};
