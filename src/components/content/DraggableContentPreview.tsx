import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  Announcements,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { DraggableImageCard } from './DraggableImageCard';
import { TextBlock } from './TextBlock';
import { DropZone } from './DropZone';
import type { ContentBlock } from '../../types/content';
import { cn } from '../../lib/utils';

interface DraggableContentPreviewProps {
  blocks: ContentBlock[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDeleteImage: (blockId: string) => void;
}

export const DraggableContentPreview = ({
  blocks,
  onReorder,
  onDeleteImage,
}: DraggableContentPreviewProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [_overId, setOverId] = useState<string | null>(null);

  // Check if first block is a header image
  const hasHeaderAtTop = useMemo(() => {
    const first = blocks[0];
    return first?.type === 'image' && first.placementType === 'header';
  }, [blocks]);

  // Get only image block IDs for sortable context
  const imageBlockIds = useMemo(
    () => blocks.filter((b) => b.type === 'image').map((b) => b.id),
    [blocks]
  );

  // Get the active block for drag overlay
  const activeBlock = useMemo(() => blocks.find((b) => b.id === activeId), [blocks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);

      if (!over || active.id === over.id) return;

      const fromIndex = blocks.findIndex((b) => b.id === active.id);
      const toIndex = blocks.findIndex((b) => b.id === over.id);

      if (fromIndex !== -1 && toIndex !== -1) {
        // Check if trying to move above header
        if (hasHeaderAtTop && toIndex === 0) {
          return; // Invalid drop
        }

        onReorder(fromIndex, toIndex);
      }
    },
    [blocks, hasHeaderAtTop, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  // Accessibility announcements
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart() {
        return `Picked up image. Use arrow keys to move, Enter to drop, Escape to cancel.`;
      },
      onDragOver({ over }) {
        if (over) {
          const overIndex = blocks.findIndex((b) => b.id === over.id);
          return `Image is over position ${overIndex + 1} of ${blocks.length}`;
        }
        return '';
      },
      onDragEnd({ over }) {
        if (over) {
          const overIndex = blocks.findIndex((b) => b.id === over.id);
          return `Image moved to position ${overIndex + 1} of ${blocks.length}`;
        }
        return 'Image dropped';
      },
      onDragCancel() {
        return 'Drag cancelled. Image returned to original position.';
      },
    }),
    [blocks]
  );

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No content to display
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{ announcements }}
    >
      <SortableContext items={imageBlockIds} strategy={verticalListSortingStrategy}>
        <div className={cn('max-w-[700px] mx-auto space-y-6')}>
          <AnimatePresence mode="popLayout">
            {blocks.map((block, index) => {
              // Determine if drop zone before this block is valid
              const isDropZoneInvalid = hasHeaderAtTop && index === 0;

              return (
                <div key={block.id}>
                  {/* Drop zone before block (except before header) */}
                  {block.type === 'image' && !isDropZoneInvalid && (
                    <DropZone
                      id={`dropzone-before-${block.id}`}
                      isActive={activeId !== null && activeId !== block.id}
                      isInvalid={isDropZoneInvalid}
                    />
                  )}

                  {/* Block content */}
                  {block.type === 'text' ? (
                    <TextBlock id={block.id} content={block.content} />
                  ) : (
                    <DraggableImageCard
                      id={block.id}
                      imageUrl={block.imageUrl}
                      aspectRatio={block.aspectRatio}
                      placementType={block.placementType}
                      altText={block.altText}
                      onDelete={() => onDeleteImage(block.id)}
                    />
                  )}
                </div>
              );
            })}
          </AnimatePresence>

          {/* Drop zone at the end */}
          {activeId && <DropZone id="dropzone-end" isActive={true} isInvalid={false} />}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeBlock && activeBlock.type === 'image' ? (
          <div className="opacity-90 shadow-2xl scale-[1.02]">
            <DraggableImageCard
              id={activeBlock.id}
              imageUrl={activeBlock.imageUrl}
              aspectRatio={activeBlock.aspectRatio}
              placementType={activeBlock.placementType}
              altText={activeBlock.altText}
              isDragging
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DraggableContentPreview;
