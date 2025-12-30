// Content block types for unified content model
export type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:2' | '9:16';
export type PlacementType = 'header' | 'body' | 'footer';

export type ContentBlock =
  | {
      type: 'text';
      id: string;
      content: string;
    }
  | {
      type: 'image';
      id: string;
      imageUrl: string;
      aspectRatio: AspectRatio;
      placementType: PlacementType;
      altText?: string;
    };

export interface ImageBlockData {
  id: string;
  imageUrl: string;
  aspectRatio: AspectRatio;
  placementType: PlacementType;
  altText?: string;
}

// Helper type guards
export function isTextBlock(block: ContentBlock): block is ContentBlock & { type: 'text' } {
  return block.type === 'text';
}

export function isImageBlock(block: ContentBlock): block is ContentBlock & { type: 'image' } {
  return block.type === 'image';
}
