import { ReactNode, useEffect } from 'react';
import { LeftNav } from './LeftNav';
import { TopHeader } from './TopHeader';
import { WizardBanner } from '@/components/onboarding/WizardBanner';
import { useNavigation, ScreenType } from '@/hooks/useNavigation';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { CompanyInfoScreen } from '@/components/screens/CompanyInfoScreen';
import { BrandVoiceScreen } from '@/components/screens/BrandVoiceScreen';
import { ImageStyleScreen } from '@/components/screens/ImageStyleScreen';
import { PagesScreen } from '@/components/screens/PagesScreen';
import { PageEditorScreen } from '@/components/screens/PageEditorScreen';

interface AppLayoutProps {
  children?: ReactNode;
}

// Map onboarding steps to screen types
const stepToScreen: Record<OnboardingStep, ScreenType> = {
  company: 'company',
  voice: 'voice',
  style: 'style',
  pages: 'new-page', // Step 4 goes directly to page editor
};

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

  const { isOnboarding, currentStep } = useOnboarding();

  // Sync navigation with onboarding step
  useEffect(() => {
    if (isOnboarding) {
      const targetScreen = stepToScreen[currentStep];
      if (targetScreen !== activeScreen) {
        setActiveScreen(targetScreen);
      }
    }
  }, [isOnboarding, currentStep, activeScreen, setActiveScreen]);

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
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <TopHeader activeScreen={activeScreen} />
        <WizardBanner />
        <div className="flex flex-1 overflow-hidden">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <TopHeader activeScreen={activeScreen} />
      <WizardBanner />
      <div className="flex flex-1 overflow-hidden">
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
    </div>
  );
};
