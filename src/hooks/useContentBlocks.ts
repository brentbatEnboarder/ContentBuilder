import { useState, useCallback } from 'react';
import type { ContentBlock } from '../types/content';

interface UseContentBlocksOptions {
  initialBlocks?: ContentBlock[];
}

/**
 * Hook for managing content blocks (text and images) with drag-and-drop reordering
 *
 * Key behaviors:
 * - Header images at position 0 cannot be moved
 * - No blocks can be dropped above a header image at position 0
 * - Adjacent text blocks are merged when a block is deleted
 */
export const useContentBlocks = ({ initialBlocks = [] }: UseContentBlocksOptions = {}) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);

  /**
   * Reorder blocks with validation for header image constraints
   */
  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prevBlocks) => {
      const block = prevBlocks[fromIndex];

      // Don't allow moving header images from position 0
      if (block.type === 'image' && block.placementType === 'header' && fromIndex === 0) {
        return prevBlocks;
      }

      // Don't allow dropping above header image at position 0
      const firstBlock = prevBlocks[0];
      if (
        firstBlock?.type === 'image' &&
        firstBlock.placementType === 'header' &&
        toIndex === 0
      ) {
        return prevBlocks;
      }

      const newBlocks = [...prevBlocks];
      newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, block);
      return newBlocks;
    });
  }, []);

  /**
   * Delete a block and merge adjacent text blocks
   */
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prevBlocks) => {
      const blockIndex = prevBlocks.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevBlocks;

      const newBlocks = [...prevBlocks];
      newBlocks.splice(blockIndex, 1);

      // Merge adjacent text blocks if needed
      const mergedBlocks: ContentBlock[] = [];
      for (const block of newBlocks) {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];
        if (
          block.type === 'text' &&
          lastBlock?.type === 'text'
        ) {
          // Merge text blocks
          mergedBlocks[mergedBlocks.length - 1] = {
            ...lastBlock,
            content: lastBlock.content + '\n\n' + block.content,
          };
        } else {
          mergedBlocks.push(block);
        }
      }

      return mergedBlocks;
    });
  }, []);

  /**
   * Add a block at a specific index or at the end
   */
  const addBlock = useCallback((block: ContentBlock, index?: number) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      if (index !== undefined) {
        newBlocks.splice(index, 0, block);
      } else {
        newBlocks.push(block);
      }
      return newBlocks;
    });
  }, []);

  /**
   * Update a block's properties (type-safe - won't change block type)
   */
  const updateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.id !== blockId) return block;
        if (block.type === 'text' && updates.type !== 'image') {
          return { ...block, ...updates } as ContentBlock;
        }
        if (block.type === 'image' && updates.type !== 'text') {
          return { ...block, ...updates } as ContentBlock;
        }
        return block;
      })
    );
  }, []);

  /**
   * Replace all blocks
   */
  const setAllBlocks = useCallback((newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  /**
   * Get only image blocks
   */
  const getImageBlocks = useCallback(() => {
    return blocks.filter((block): block is Extract<ContentBlock, { type: 'image' }> =>
      block.type === 'image'
    );
  }, [blocks]);

  /**
   * Get only text blocks
   */
  const getTextBlocks = useCallback(() => {
    return blocks.filter((block): block is Extract<ContentBlock, { type: 'text' }> =>
      block.type === 'text'
    );
  }, [blocks]);

  /**
   * Check if a block can be moved to a target position
   */
  const canMoveTo = useCallback((blockId: string, toIndex: number): boolean => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    const block = blocks[blockIndex];

    // Header images at position 0 can't be moved
    if (block.type === 'image' && block.placementType === 'header' && blockIndex === 0) {
      return false;
    }

    // Can't move to position 0 if there's a header there
    const firstBlock = blocks[0];
    if (
      firstBlock?.type === 'image' &&
      firstBlock.placementType === 'header' &&
      toIndex === 0
    ) {
      return false;
    }

    return true;
  }, [blocks]);

  return {
    blocks,
    reorderBlocks,
    deleteBlock,
    addBlock,
    updateBlock,
    setAllBlocks,
    getImageBlocks,
    getTextBlocks,
    canMoveTo,
  };
};

export default useContentBlocks;
