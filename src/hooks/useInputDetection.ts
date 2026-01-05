import { useState, useCallback, useMemo, useEffect } from 'react';

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

  // Prevent browser from opening files dropped anywhere on the page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add listeners to document to prevent browser default behavior
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, []);

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
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      return validTypes.includes(file.type) ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.pptx') ||
        file.name.endsWith('.xlsx');
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
