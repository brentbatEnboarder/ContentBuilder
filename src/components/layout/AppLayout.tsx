import { ReactNode } from 'react';
import { LeftNav } from './LeftNav';
import { useNavigation } from '@/hooks/useNavigation';
import { CompanyInfoScreen } from '@/components/screens/CompanyInfoScreen';
import { BrandVoiceScreen } from '@/components/screens/BrandVoiceScreen';
import { ImageStyleScreen } from '@/components/screens/ImageStyleScreen';
import { PagesScreen } from '@/components/screens/PagesScreen';
import { PageEditorScreen } from '@/components/screens/PageEditorScreen';

interface AppLayoutProps {
  children?: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { 
    isNavCollapsed, 
    activeScreen, 
    editingPageId,
    toggleNav, 
    setActiveScreen,
    editPage,
    createNewPage,
    goToPages,
  } = useNavigation();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'company':
        return <CompanyInfoScreen />;
      case 'voice':
        return <BrandVoiceScreen />;
      case 'style':
        return <ImageStyleScreen />;
      case 'pages':
        return (
          <PagesScreen 
            onEditPage={editPage}
            onCreatePage={createNewPage}
          />
        );
      case 'new-page':
        return (
          <PageEditorScreen
            pageId={null}
            onBack={goToPages}
            onNavigate={setActiveScreen}
          />
        );
      case 'page-editor':
        return (
          <PageEditorScreen
            pageId={editingPageId}
            onBack={goToPages}
            onNavigate={setActiveScreen}
          />
        );
      default:
        return <CompanyInfoScreen />;
    }
  };

  // Page editor uses full height without nav layout wrapper
  if (activeScreen === 'page-editor' || activeScreen === 'new-page') {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <LeftNav
          isCollapsed={isNavCollapsed}
          activeScreen={activeScreen}
          onToggle={toggleNav}
          onNavigate={setActiveScreen}
        />
        <main className="flex-1 overflow-hidden">
          {children || renderScreen()}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <LeftNav
        isCollapsed={isNavCollapsed}
        activeScreen={activeScreen}
        onToggle={toggleNav}
        onNavigate={setActiveScreen}
      />
      <main className="flex-1 overflow-auto">
        {children || renderScreen()}
      </main>
    </div>
  );
};
