/**
 * Voice dimension data - mirrored from frontend for server-side prompt building
 */

export interface VoiceDimension {
  id: string;
  name: string;
  leftLabel: string;
  rightLabel: string;
  valueLabels: string[];
  descriptions: string[];
}

export const voiceDimensions: VoiceDimension[] = [
  {
    id: 'formality',
    name: 'Formal ↔ Casual',
    leftLabel: 'Formal',
    rightLabel: 'Casual',
    valueLabels: [
      'Very Formal',
      'Somewhat Formal',
      'Balanced',
      'Somewhat Casual',
      'Very Casual',
    ],
    descriptions: [
      'Highly professional and polished. Uses complete sentences, formal greetings, and avoids contractions entirely.',
      'Professional but approachable. Minimal contractions, respectful language, structured communication.',
      'A blend of professional and conversational. Uses some contractions while maintaining clarity.',
      "Conversational and friendly. Uses contractions freely. Feels like talking to a colleague.",
      'Very relaxed and informal. Casual greetings, everyday language, like chatting with a friend.',
    ],
  },
  {
    id: 'humor',
    name: 'Serious ↔ Funny',
    leftLabel: 'Serious',
    rightLabel: 'Funny',
    valueLabels: [
      'Very Serious',
      'Mostly Serious',
      'Balanced',
      'Somewhat Funny',
      'Very Funny',
    ],
    descriptions: [
      'Strictly business. No humor or playfulness. Focused entirely on delivering information clearly.',
      'Primarily serious with occasional warmth. Information-focused but not cold.',
      'Professional with light moments. May include gentle humor when appropriate.',
      'Friendly and playful. Uses humor to engage while still being informative.',
      'Fun and entertaining. Embraces humor, wit, and personality throughout.',
    ],
  },
  {
    id: 'respect',
    name: 'Respectful ↔ Irreverent',
    leftLabel: 'Respectful',
    rightLabel: 'Irreverent',
    valueLabels: [
      'Very Respectful',
      'Mostly Respectful',
      'Balanced',
      'Somewhat Irreverent',
      'Very Irreverent',
    ],
    descriptions: [
      'Highly deferential and traditional. Follows all conventions. Never challenges the status quo.',
      'Respectful of traditions while being direct. Professional but not stuffy.',
      'Respects norms but willing to be direct. Balances tradition with authenticity.',
      'Challenges conventions lightly. Questions the "way things are done" in a friendly way.',
      'Bold and unconventional. Breaks from tradition. Embraces a "rules are guidelines" mentality.',
    ],
  },
  {
    id: 'enthusiasm',
    name: 'Matter-of-fact ↔ Enthusiastic',
    leftLabel: 'Matter-of-fact',
    rightLabel: 'Enthusiastic',
    valueLabels: [
      'Very Matter-of-fact',
      'Somewhat Matter-of-fact',
      'Balanced',
      'Somewhat Enthusiastic',
      'Very Enthusiastic',
    ],
    descriptions: [
      'Neutral and objective. States facts without emotional language. Lets information speak for itself.',
      'Mostly neutral with subtle warmth. Informative without being dry.',
      'Warm but measured. Shows genuine interest without overdoing it.',
      'Energetic and positive. Uses exclamation points and expressive language.',
      'Highly energetic and celebratory! Overflows with excitement and positivity!',
    ],
  },
];
