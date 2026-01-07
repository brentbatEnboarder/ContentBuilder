import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { MOCKUP_TEMPLATES, type MockupTemplate } from '@/types/mockup';

interface MockupSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: MockupTemplate) => void;
  isLoading?: boolean;
}

export const MockupSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}: MockupSelectionModalProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);

  const handleSubmit = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Select mockup template"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Create Device Mockup</h2>
                  <p className="text-sm text-muted-foreground">
                    Select a mockup template for your content
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Template Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {MOCKUP_TEMPLATES.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={cn(
                        'relative group rounded-xl overflow-hidden transition-all duration-200',
                        'border-2 hover:shadow-lg',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                          : 'border-border/50 hover:border-primary/50'
                      )}
                    >
                      {/* Template Image */}
                      <div className="aspect-[4/3] relative">
                        <img
                          src={template.imagePath}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Selection Overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        {/* Hover Overlay */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        )}
                      </div>
                      {/* Template Info */}
                      <div className="p-3 bg-card">
                        <p className="text-sm font-medium text-foreground truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/30">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedTemplate || isLoading}
                className="gap-2 bg-gradient-to-b from-primary to-primary-hover"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Generate Mockup
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MockupSelectionModal;
