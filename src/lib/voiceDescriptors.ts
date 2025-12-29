import type { VoiceSettings } from '@/hooks/useVoiceSettings';

const formalityDescriptors = [
  'very formal and professional',
  'formal yet approachable',
  'balanced and professional',
  'friendly and conversational',
  'casual and relaxed',
];

const humorDescriptors = [
  'strictly serious',
  'mostly serious with warmth',
  'balanced with subtle wit',
  'playful and light',
  'humorous and entertaining',
];

const respectDescriptors = [
  'highly deferential',
  'polite and considerate',
  'friendly and direct',
  'casual and straightforward',
  'authentic and unfiltered',
];

const enthusiasmDescriptors = [
  'calm and measured',
  'reserved but positive',
  'moderate energy',
  'noticeable enthusiasm',
  'high energy and excitement',
];

export const generateVoicePreview = (settings: VoiceSettings): string => {
  const formality = formalityDescriptors[settings.formality];
  const humor = humorDescriptors[settings.humor];
  const respect = respectDescriptors[settings.respect];
  const enthusiasm = enthusiasmDescriptors[settings.enthusiasm];

  return `Based on your settings, content will sound ${formality}, ${humor}, ${respect}, with ${enthusiasm}.`;
};

export const sliderConfigs = [
  {
    key: 'formality' as const,
    title: 'Formality',
    description: 'How formal should the language be?',
    leftLabel: 'Formal',
    rightLabel: 'Casual',
  },
  {
    key: 'humor' as const,
    title: 'Humor',
    description: 'How much humor should be included?',
    leftLabel: 'Serious',
    rightLabel: 'Funny',
  },
  {
    key: 'respect' as const,
    title: 'Respect',
    description: 'How traditional vs. irreverent should the tone be?',
    leftLabel: 'Respectful',
    rightLabel: 'Irreverent',
  },
  {
    key: 'enthusiasm' as const,
    title: 'Enthusiasm',
    description: 'How energetic should the tone be?',
    leftLabel: 'Matter-of-fact',
    rightLabel: 'Enthusiastic',
  },
];
