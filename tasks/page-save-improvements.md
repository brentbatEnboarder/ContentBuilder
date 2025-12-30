# Page Save Improvements - Future Work

## Current Status
Basic page saving is not working correctly. This document tracks the issues identified and improvements needed.

---

## Critical Issues (To Debug Now)

### Save Not Persisting
- The save button shows success toast but data may not be persisting to Supabase
- Need to investigate:
  - Is the Supabase mutation being called?
  - Are there RLS policy issues?
  - Is the data being sent correctly?

---

## Known Architectural Issues

### 1. Large Image Data in Database
**Problem:** Images are stored as base64 data URLs directly in the `content.images` array. Each image can be several MB.

**Impact:**
- Slow page load/save times
- Database storage costs
- Potential column size limits

**Solution:** Upload images to Supabase Storage, store only the public URLs in the database.

```typescript
// Future implementation sketch
const uploadedUrl = await supabase.storage
  .from('page-images')
  .upload(`${pageId}/${imageId}.png`, base64ToBlob(imageData));
```

---

### 2. Content Blocks Not Restored on Page Load
**Problem:** When a page with saved images is loaded, the `ContentBlock[]` array is not populated from `generatedContent.images`. The draggable preview only works during the session when images were applied.

**Impact:**
- After page reload, falls back to static preview
- Drag-drop reordering is lost
- Image placement metadata (header/body) is lost

**Solution:** When loading a page, reconstruct `ContentBlock[]` from saved data:

```typescript
// In PageEditorScreen, after page loads
useEffect(() => {
  if (generatedContent.images.length > 0 && blocks.length === 0) {
    // Reconstruct blocks from saved content
    const reconstructedBlocks = reconstructBlocksFromContent(generatedContent);
    setAllBlocks(reconstructedBlocks);
  }
}, [generatedContent]);
```

**Additional Change Needed:** Save placement metadata alongside images, e.g.:
```typescript
content: {
  text: string;
  images: Array<{
    url: string;
    placementType: 'header' | 'body';
    aspectRatio: AspectRatio;
    altText?: string;
  }>;
}
```

---

### 3. Text/Blocks Sync Issue
**Problem:** After applying images, if user continues chatting to modify text:
- `generatedContent.text` gets updated (by chat streaming)
- But the text block in `blocks` array still has the old text

**Impact:**
- Draggable preview shows stale text
- Confusing UX

**Solution Options:**

**Option A:** Sync text changes to blocks
```typescript
useEffect(() => {
  if (blocks.length > 0) {
    setAllBlocks(blocks.map(b =>
      b.type === 'text' ? { ...b, content: generatedContent.text } : b
    ));
  }
}, [generatedContent.text]);
```

**Option B:** Make blocks the source of truth
- Extract text from blocks when saving
- Update text block when chat streams new content

---

### 4. New Page URL Issue
**Problem:** When creating a new page (pageId = null), after save the URL might still reflect the temp state.

**Impact:**
- If user refreshes, the saved page won't load
- Navigation state mismatch

**Solution:** After successful save of new page, update the URL/navigation to use the real page ID:
```typescript
const savedPage = await save();
if (savedPage && savedPage.id !== pageId) {
  // Update URL to reflect new page ID
  navigate(`/pages/${savedPage.id}`, { replace: true });
}
```

---

## Implementation Priority

1. **P0 - Debug basic save** - Must work before anything else
2. **P1 - Image storage migration** - Important for performance/cost
3. **P2 - Blocks restoration on load** - UX improvement
4. **P3 - Text sync** - Edge case UX fix
5. **P4 - URL update after new page save** - Navigation polish

---

## Files Involved

| File | Role |
|------|------|
| `src/hooks/usePageEditor.ts` | Save logic, state management |
| `src/hooks/usePages.ts` | Supabase mutations |
| `src/hooks/useContentBlocks.ts` | Block state (not persisted) |
| `src/components/screens/PageEditorScreen.tsx` | Orchestration |
| `src/components/preview/PreviewPane.tsx` | Rendering |

---

## Database Schema Reference

```sql
-- Current pages table
pages (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  title TEXT,
  content JSONB,        -- { text: string, images: string[] }
  chat_history JSONB,   -- ChatMessage[]
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```
