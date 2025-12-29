import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageCard } from '@/components/pages/PageCard';
import { EmptyPagesState } from '@/components/pages/EmptyPagesState';
import { DeletePageDialog } from '@/components/pages/DeletePageDialog';
import { usePages } from '@/hooks/usePages';
import { toast } from 'sonner';
import type { Page } from '@/types/page';

interface PagesScreenProps {
  onEditPage?: (pageId: string) => void;
  onCreatePage?: () => void;
}

export const PagesScreen = ({ onEditPage, onCreatePage }: PagesScreenProps) => {
  const {
    pages,
    allPages,
    searchQuery,
    setSearchQuery,
    createPage,
    deletePage,
    duplicatePage,
  } = usePages();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    page: Page | null;
  }>({ open: false, page: null });

  const handleCreatePage = async () => {
    try {
      const newPage = await createPage();
      toast.success('New page created');
      if (onCreatePage) {
        onCreatePage();
      } else if (onEditPage) {
        onEditPage(newPage.id);
      }
    } catch (error) {
      toast.error('Failed to create page');
      console.error('Create page error:', error);
    }
  };

  const handleEditPage = (pageId: string) => {
    if (onEditPage) {
      onEditPage(pageId);
    }
  };

  const handleDuplicatePage = async (pageId: string) => {
    try {
      const duplicate = await duplicatePage(pageId);
      toast.success(`Created "${duplicate.title}"`);
    } catch (error) {
      toast.error('Failed to duplicate page');
      console.error('Duplicate page error:', error);
    }
  };

  const handleDeleteClick = (page: Page) => {
    setDeleteDialog({ open: true, page });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.page) {
      try {
        await deletePage(deleteDialog.page.id);
        toast.success('Page deleted');
      } catch (error) {
        toast.error('Failed to delete page');
        console.error('Delete page error:', error);
      }
    }
    setDeleteDialog({ open: false, page: null });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, page: null });
  };

  const isEmpty = allPages.length === 0;
  const noResults = pages.length === 0 && searchQuery.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        {!isEmpty && (
          <Button onClick={handleCreatePage}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        )}
      </div>

      {isEmpty ? (
        <EmptyPagesState onCreatePage={handleCreatePage} />
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Page List */}
          {noResults ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No pages found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onClick={() => handleEditPage(page.id)}
                  onEdit={() => handleEditPage(page.id)}
                  onDuplicate={() => handleDuplicatePage(page.id)}
                  onDelete={() => handleDeleteClick(page)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeletePageDialog
        open={deleteDialog.open}
        pageTitle={deleteDialog.page?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
