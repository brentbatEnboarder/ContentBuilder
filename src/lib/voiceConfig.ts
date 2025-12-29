export type DimensionKey = 'formality' | 'humor' | 'respect' | 'enthusiasm';

export interface DimensionValue {
  label: string;
  description: string;
  example: string;
}

export interface DimensionConfig {
  key: DimensionKey;
  title: string;
  description: string;
  left: string;
  right: string;
  values: DimensionValue[];
}

export const dimensionConfig: Record<DimensionKey, DimensionConfig> = {
  formality: {
    key: 'formality',
    title: 'Formality',
    description: 'How formal should the language be?',
    left: 'Formal',
    right: 'Casual',
    values: [
      {
        label: 'Very Formal',
        description: 'Corporate, professional language with complete sentences and proper titles. No contractions.',
        example: 'Dear Team Members: Please be advised that the annual performance review process will commence on the first of next month.',
      },
      {
        label: 'Somewhat Formal',
        description: 'Professional but approachable. Occasional contractions acceptable.',
        example: "Hi team, We'll be starting performance reviews next month. HR will reach out to schedule your appointment soon.",
      },
      {
        label: 'Balanced',
        description: 'Mix of professional and conversational. Natural language.',
        example: "Hey everyone, Performance reviews are coming up next month. We'll send you a calendar invite to pick your time slot.",
      },
      {
        label: 'Somewhat Casual',
        description: 'Conversational and friendly. Uses contractions freely. Feels like talking to a colleague.',
        example: "Hey team! Review season's coming up next month. You'll get an invite to grab a time that works for you.",
      },
      {
        label: 'Very Casual',
        description: 'Relaxed, informal tone. Short sentences. May use colloquialisms.',
        example: "Heads up! Reviews are next month. We'll ping you to book a slot that works.",
      },
    ],
  },
  humor: {
    key: 'humor',
    title: 'Humor',
    description: 'How much humor should be included?',
    left: 'Serious',
    right: 'Funny',
    values: [
      {
        label: 'Very Serious',
        description: 'Strictly professional. No humor or playfulness whatsoever.',
        example: 'The deadline for benefits enrollment is November 15th. All forms must be submitted by 5:00 PM EST.',
      },
      {
        label: 'Mostly Serious',
        description: 'Professional with occasional light moments. Warmth without jokes.',
        example: "Benefits enrollment ends November 15th. Don't forget to review your options before the deadline.",
      },
      {
        label: 'Balanced',
        description: 'Professional with subtle wit. Friendly but not silly.',
        example: "Benefits enrollment closes November 15th. Now's a great time to make sure you're covered.",
      },
      {
        label: 'Somewhat Funny',
        description: 'Includes light humor and playful language. Personality shines through.',
        example: "Benefits enrollment ends November 15th. Future-you will thank present-you for taking 5 minutes to review!",
      },
      {
        label: 'Very Funny',
        description: 'Embraces humor and personality. Memorable and entertaining.',
        example: "Benefits enrollment ends November 15th. Unless you've figured out how to not get sick ever, might want to take a peek! 🏥",
      },
    ],
  },
  respect: {
    key: 'respect',
    title: 'Respect',
    description: 'How traditional vs. irreverent should the tone be?',
    left: 'Respectful',
    right: 'Irreverent',
    values: [
      {
        label: 'Very Respectful',
        description: 'Highly deferential. Traditional corporate hierarchy acknowledged.',
        example: 'We kindly request your participation in the upcoming company survey. Your valuable insights are greatly appreciated.',
      },
      {
        label: 'Respectful',
        description: 'Polite and considerate. Professional courtesy maintained.',
        example: "We'd love your input on our company survey. Your feedback helps us improve.",
      },
      {
        label: 'Balanced',
        description: 'Friendly and direct. Neither overly formal nor too casual.',
        example: 'Take our quick company survey! Your honest feedback makes a real difference.',
      },
      {
        label: 'Somewhat Irreverent',
        description: 'Casual and direct. Willing to poke fun at corporate norms.',
        example: "Survey time! Promise it's not as boring as it sounds. Tell us what you really think.",
      },
      {
        label: 'Very Irreverent',
        description: 'Breaks corporate conventions. Authentic and unfiltered.',
        example: "Real talk: we want your honest feedback. No corporate speak, just tell us what's working and what's not.",
      },
    ],
  },
  enthusiasm: {
    key: 'enthusiasm',
    title: 'Enthusiasm',
    description: 'How energetic should the tone be?',
    left: 'Matter-of-fact',
    right: 'Enthusiastic',
    values: [
      {
        label: 'Very Matter-of-fact',
        description: 'Neutral delivery. Just the facts, no emotional language.',
        example: 'The team meeting is scheduled for Thursday at 2 PM. Please review the agenda beforehand.',
      },
      {
        label: 'Mostly Matter-of-fact',
        description: 'Calm and measured. Slight warmth but restrained.',
        example: 'Our team meeting is Thursday at 2 PM. Looking forward to discussing the agenda items.',
      },
      {
        label: 'Balanced',
        description: 'Moderate energy. Positive without being over-the-top.',
        example: "Team meeting is Thursday at 2 PM! We've got some good topics to cover.",
      },
      {
        label: 'Somewhat Enthusiastic',
        description: 'Noticeable energy and positivity. Engaging and motivating.',
        example: "Team meeting Thursday at 2 PM! Excited to share some great updates with everyone.",
      },
      {
        label: 'Very Enthusiastic',
        description: 'High energy and excitement. Inspiring and dynamic.',
        example: "Can't wait for Thursday's team meeting at 2 PM! 🎉 We've got amazing news to share!",
      },
    ],
  },
};

export const sliderConfigs = Object.values(dimensionConfig).map((dim) => ({
  key: dim.key,
  title: dim.title,
  description: dim.description,
  leftLabel: dim.left,
  rightLabel: dim.right,
}));

// Sample generators
export function generateWelcomeMessage(
  formality: number,
  humor: number,
  respect: number,
  enthusiasm: number
): string {
  let message = '';

  // Greeting
  if (formality <= 1) {
    message += 'Dear Sarah,\n\n';
  } else if (formality <= 2) {
    message += 'Hi Sarah,\n\n';
  } else {
    message += 'Hey Sarah!\n\n';
  }

  // Opening
  if (enthusiasm >= 3) {
    message += "Welcome to the team! We're thrilled to have you joining us.";
  } else if (enthusiasm >= 2) {
    message += "Welcome to the team. We're glad to have you with us.";
  } else {
    message += 'Welcome to the team.';
  }

  // Main content
  message += '\n\n';
  if (formality <= 1) {
    message += 'Your onboarding schedule has been prepared and will be sent to your email address. Please review it at your earliest convenience.';
  } else if (formality <= 2) {
    message += "We've put together an onboarding schedule for you. Check your inbox for the details.";
  } else {
    message += "Your onboarding schedule is in your inbox. Take a look when you get a chance!";
  }

  // Humor touch (conditional)
  if (humor >= 3) {
    message += " (Don't worry, we kept the paperwork to a minimum. Well, minimum-ish.)";
  } else if (humor >= 2) {
    message += " Don't worry, we made it easy to follow!";
  }

  // Respect variation
  if (respect >= 3) {
    message += '\n\nFeel free to ping anyone if you have questions. No such thing as a dumb question here.';
  } else if (respect <= 1) {
    message += '\n\nShould you have any questions, please do not hesitate to reach out to your assigned mentor.';
  } else {
    message += '\n\nReach out to your buddy or anyone on the team if you need help.';
  }

  // Closing
  message += '\n\n';
  if (enthusiasm >= 3) {
    message += "Can't wait to meet you! 🎉";
  } else if (enthusiasm >= 2) {
    message += 'Looking forward to working with you!';
  } else {
    message += formality <= 1 ? 'Regards,\nThe HR Team' : 'Thanks,\nThe HR Team';
  }

  return message;
}

export function generateBenefitsReminder(
  formality: number,
  humor: number,
  respect: number,
  enthusiasm: number
): string {
  let message = '';

  // Greeting
  if (formality <= 1) {
    message += 'Dear Team,\n\n';
  } else if (formality <= 2) {
    message += 'Hi everyone,\n\n';
  } else {
    message += 'Hey team!\n\n';
  }

  // Opening - deadline mention
  if (enthusiasm >= 3) {
    message += "Quick heads up – open enrollment ends Friday! 🗓️";
  } else if (enthusiasm >= 2) {
    message += 'Friendly reminder that open enrollment closes this Friday.';
  } else {
    message += 'Open enrollment closes on Friday.';
  }

  // Main content
  message += '\n\n';
  if (formality <= 1) {
    message += 'Please ensure you have reviewed and selected your benefits options before the deadline. Changes cannot be made after Friday.';
  } else if (formality <= 2) {
    message += "Make sure to review your options and submit any changes before the deadline. You won't be able to make changes until next year.";
  } else {
    message += "Take a few minutes to check your options. Once Friday hits, you're locked in until next year!";
  }

  // Humor touch
  if (humor >= 4) {
    message += "\n\nFuture-you will high-five present-you for taking care of this now. Trust us. 🙌";
  } else if (humor >= 3) {
    message += "\n\nPro tip: grab a coffee and knock this out in 10 minutes. Easy win!";
  }

  // Respect variation
  if (respect >= 3) {
    message += '\n\nNo judgment if you forgot – we all do. Just get it done!';
  } else if (respect <= 1) {
    message += '\n\nIf you require assistance, please contact HR at your convenience.';
  }

  // Closing
  message += '\n\n';
  if (enthusiasm >= 3) {
    message += "You've got this! Let us know if you need help.";
  } else if (enthusiasm >= 2) {
    message += "Questions? We're here to help.";
  } else {
    message += 'Contact HR with any questions.';
  }

  return message;
}

export function generatePolicyUpdate(
  formality: number,
  humor: number,
  respect: number,
  enthusiasm: number
): string {
  let message = '';

  // Greeting
  if (formality <= 1) {
    message += 'Dear Colleagues,\n\n';
  } else if (formality <= 2) {
    message += 'Hi team,\n\n';
  } else {
    message += 'Hey everyone!\n\n';
  }

  // Opening
  if (enthusiasm >= 3) {
    message += "Exciting news about our remote work policy! 🏠";
  } else if (enthusiasm >= 2) {
    message += "We're updating our remote work policy with some changes you'll want to know about.";
  } else {
    message += 'We are updating our remote work policy effective next month.';
  }

  // Main content
  message += '\n\n';
  if (formality <= 1) {
    message += 'Effective the first of next month, employees may work remotely up to three days per week. Core hours of 10 AM to 3 PM must be maintained.';
  } else if (formality <= 2) {
    message += "Starting next month, you can work from home up to 3 days a week. Just be available during core hours (10 AM - 3 PM).";
  } else {
    message += "You can now WFH up to 3 days a week! Just stay online during core hours (10-3) and you're golden.";
  }

  // Humor touch
  if (humor >= 4) {
    message += "\n\nYes, this means more days in sweatpants. You're welcome. 🩳";
  } else if (humor >= 3) {
    message += "\n\nPajama pants optional, but we won't judge during video calls.";
  }

  // Respect variation
  if (respect >= 3) {
    message += "\n\nWe heard you wanted more flexibility – here it is!";
  } else if (respect <= 1) {
    message += '\n\nPlease review the full policy document attached for complete details.';
  } else {
    message += '\n\nCheck the full policy doc for all the details.';
  }

  // Closing
  message += '\n\n';
  if (enthusiasm >= 3) {
    message += "Can't wait to see how this helps everyone thrive! 🚀";
  } else if (enthusiasm >= 2) {
    message += 'Looking forward to this positive change!';
  } else {
    message += 'Questions? Contact HR.';
  }

  return message;
}

export function generatePerformanceReview(
  formality: number,
  humor: number,
  respect: number,
  enthusiasm: number
): string {
  let message = '';

  // Greeting
  if (formality <= 1) {
    message += 'Dear Team Member,\n\n';
  } else if (formality <= 2) {
    message += 'Hi there,\n\n';
  } else {
    message += 'Hey!\n\n';
  }

  // Opening
  if (enthusiasm >= 3) {
    message += "It's that time – quarterly reviews are here! 📊";
  } else if (enthusiasm >= 2) {
    message += 'Quarterly performance reviews are starting next week.';
  } else {
    message += 'Q4 performance reviews will begin next week.';
  }

  // Main content
  message += '\n\n';
  if (formality <= 1) {
    message += 'Your manager will be scheduling a one-hour meeting to discuss your performance, goals, and development opportunities. Please come prepared with your self-assessment.';
  } else if (formality <= 2) {
    message += "You'll get a calendar invite from your manager soon. Come ready to talk about what you've accomplished and where you want to grow.";
  } else {
    message += "Your manager will ping you with a time. Bring your wins and goals – this is your time to shine!";
  }

  // Humor touch
  if (humor >= 4) {
    message += "\n\nDon't stress – it's a conversation, not an interrogation. Promise! 😅";
  } else if (humor >= 3) {
    message += "\n\nNo pop quizzes, we promise. Just a good chat about your growth.";
  }

  // Respect variation
  if (respect >= 3) {
    message += "\n\nThis is your chance to brag a little. Seriously, don't hold back!";
  } else if (respect <= 1) {
    message += '\n\nWe value your contributions and look forward to discussing your continued development.';
  } else {
    message += '\n\nThis is a two-way conversation. Share what support you need!';
  }

  // Closing
  message += '\n\n';
  if (enthusiasm >= 3) {
    message += "Excited to celebrate your wins together! 🎉";
  } else if (enthusiasm >= 2) {
    message += 'Looking forward to catching up!';
  } else {
    message += 'Best,\nHR Team';
  }

  return message;
}

export interface SampleConfig {
  id: string;
  badge: string;
  title: string;
  generator: (f: number, h: number, r: number, e: number) => string;
}

export const sampleConfigs: SampleConfig[] = [
  {
    id: 'welcome',
    badge: 'WELCOME MESSAGE',
    title: 'New hire first day email',
    generator: generateWelcomeMessage,
  },
  {
    id: 'benefits',
    badge: 'BENEFITS REMINDER',
    title: 'Open enrollment deadline',
    generator: generateBenefitsReminder,
  },
  {
    id: 'policy',
    badge: 'POLICY UPDATE',
    title: 'Remote work policy change',
    generator: generatePolicyUpdate,
  },
  {
    id: 'performance',
    badge: 'PERFORMANCE REVIEW',
    title: 'Quarterly review invitation',
    generator: generatePerformanceReview,
  },
];
