# Brand Voice Dimension Sliders - Technical Specification

## Overview

An interactive component that allows users to define their brand voice using four empirically-validated dimensions from Nielsen Norman Group research. The component provides real-time visual feedback showing how voice settings affect actual HR communications through dynamically generated samples.

## Purpose

Enable HR teams to systematically define and codify their brand voice for use in AI-powered copywriting systems. The component translates qualitative brand personality into structured, machine-readable parameters while providing immediate visual feedback through contextual examples.

## Technical Requirements

### Framework
- React 18+ with hooks (useState)
- Lucide React for icons
- Tailwind CSS for styling (or custom CSS)

### Dependencies
```json
{
  "react": "^18.0.0",
  "lucide-react": "^0.263.0"
}
```

## Component Structure

### Main Component: `BrandVoiceSliders`

#### State Management
```javascript
const [dimensions, setDimensions] = useState({
  formality: 2,    // 0-4 scale, default to middle
  humor: 2,        // 0-4 scale, default to middle
  respect: 2,      // 0-4 scale, default to middle
  enthusiasm: 2    // 0-4 scale, default to middle
});

const [activeInfo, setActiveInfo] = useState(null); // Tracks which dimension was last adjusted
```

## The Four Voice Dimensions

### Scale Standard
- **5-point scale (0-4)** following Nielsen Norman Group research
- 0 = Far left extreme
- 2 = Balanced/Neutral
- 4 = Far right extreme

### Dimension 1: Formal ↔ Casual

**Left Label:** Formal  
**Right Label:** Casual

| Value | Label | Description | HR Example |
|-------|-------|-------------|------------|
| 0 | Very Formal | Corporate, professional language with complete sentences and proper titles. No contractions. | "Dear Team Members: Please be advised that the annual performance review process will commence on the first of next month. Human Resources will contact you to schedule your review appointment." |
| 1 | Somewhat Formal | Professional but approachable. Occasional contractions acceptable. Structured but not stiff. | "Hi team, We'll be starting performance reviews next month. HR will reach out to schedule your appointment soon." |
| 2 | Balanced | Mix of professional and conversational. Natural language that feels neither too stiff nor too relaxed. | "Hey everyone, Performance reviews are coming up next month. We'll send you a calendar invite to pick your time slot." |
| 3 | Somewhat Casual | Conversational and friendly. Uses contractions freely. Feels like talking to a colleague. | "Hey team! Review season's coming up next month. You'll get an invite to grab a time that works for you." |
| 4 | Very Casual | Relaxed, informal tone. Short sentences. Feels like chatting with a friend. May use colloquialisms. | "Heads up! Reviews are next month. We'll ping you to book a slot that works." |

### Dimension 2: Serious ↔ Funny

**Left Label:** Serious  
**Right Label:** Funny

| Value | Label | Description | HR Example |
|-------|-------|-------------|------------|
| 0 | Very Serious | Strictly factual and professional. No humor, no levity. Appropriate for sensitive or compliance topics. | "Your health insurance enrollment period closes Friday, December 15 at 5:00 PM. Failure to enroll will result in no coverage for the next calendar year." |
| 1 | Mostly Serious | Primarily factual with occasional warmth. May show empathy but avoids jokes or playfulness. | "Reminder: Health insurance enrollment closes this Friday at 5 PM. We know choosing plans can be complex—our benefits team is here to help if you have questions." |
| 2 | Balanced | Professional with moments of lightness. Warm and human without crossing into jokes or humor. | "Health insurance enrollment wraps up Friday at 5 PM. Don't let decision fatigue win—reach out if you need help picking the right plan!" |
| 3 | Somewhat Funny | Light humor and playfulness where appropriate. Warm personality with occasional wit, but never at someone's expense. | "The health insurance enrollment deadline is Friday at 5 PM. (That's this Friday, not 'next Friday when I'm less busy' Friday!) Questions? We're here to help you decode the insurance jargon." |
| 4 | Very Funny | Frequent humor, wordplay, and personality. Entertaining while still being helpful. Only appropriate for non-sensitive topics. | "Clock's ticking on health insurance enrollment—Friday at 5 PM is the deadline! ⏰ Don't worry, we won't send a singing telegram, but we will send reminder emails. Need help? We speak fluent 'insurance confusing-ese' and can translate." |

### Dimension 3: Respectful ↔ Irreverent

**Left Label:** Respectful  
**Right Label:** Irreverent

| Value | Label | Description | HR Example |
|-------|-------|-------------|------------|
| 0 | Very Respectful | Highly deferential. Honors all conventions and protocols. Careful with authority and hierarchy. | "We respectfully request that all employees review the updated expense policy. Should you have any questions or concerns, please do not hesitate to contact the Finance Department." |
| 1 | Mostly Respectful | Professional and courteous. Honors conventions while being personable. Values employee perspective. | "We've updated our expense policy to make things clearer. Please take a few minutes to review the changes. If anything seems unclear, the Finance team is happy to help." |
| 2 | Balanced | Respectful of people, occasionally irreverent about processes. Questions bureaucracy without being dismissive. | "New expense policy alert! We simplified the approval process (yes, less bureaucracy). Take a look and let Finance know if you have questions." |
| 3 | Somewhat Irreverent | Challenges conventions and pokes fun at bureaucracy. Respects people while questioning unnecessary complexity. | "We rewrote the expense policy because the old one was 47 pages of jargon nobody read. The new version: actually useful! Check it out and tell Finance if we missed anything." |
| 4 | Very Irreverent | Bold and iconoclastic. Actively challenges traditional corporate norms. Respects individuals but not stuffy conventions. | "The old expense policy was basically a choose-your-own-adventure novel nobody finished. We burned it. Here's the new one: 2 pages, no jargon, actually makes sense. You're welcome." |

### Dimension 4: Enthusiastic ↔ Matter-of-fact

**Left Label:** Matter-of-fact  
**Right Label:** Enthusiastic

| Value | Label | Description | HR Example |
|-------|-------|-------------|------------|
| 0 | Very Matter-of-fact | Neutral, factual tone. No emotional language. Focuses on information delivery without embellishment. | "Open enrollment begins Monday, November 6 and ends Friday, November 17. Log into the benefits portal to review your options and make selections." |
| 1 | Somewhat Matter-of-fact | Straightforward with subtle warmth. Informative focus with minimal emotional language. | "Open enrollment runs November 6-17. Log into the benefits portal to review your options. The HR team can answer questions if needed." |
| 2 | Balanced | Even energy that's neither flat nor overly excited. Steady, supportive presence. | "Open enrollment is here! It runs November 6-17. Take some time to review your benefits options in the portal. We're here if you need help deciding." |
| 3 | Somewhat Enthusiastic | Positive energy and genuine interest. Shows care about employee experience without excessive excitement. | "Great news—open enrollment starts November 6! You'll have until the 17th to explore your options and pick what works for you. Excited to help you find the right benefits!" |
| 4 | Very Enthusiastic | High energy, celebratory language. Frequent exclamation points. Treats most topics as opportunities to engage. | "Open enrollment is LIVE! 🎉 From November 6-17, you can explore all our amazing benefits options! We can't wait to help you build the perfect benefits package. Let's do this!" |

## UI Layout Specification

### Main Container
- Max width: 1024px (max-w-4xl)
- Centered horizontally
- Full height with light gray background (#F9FAFB)
- 2rem padding (p-8)

### Card Container
- White background
- Rounded corners (rounded-lg)
- Drop shadow (shadow-lg)
- 2rem internal padding (p-8)

### Header Section
```
┌─────────────────────────────────────────────────┐
│ Brand Voice Dimensions           [3xl, bold]    │
│ Move each slider to define...    [gray-600]     │
└─────────────────────────────────────────────────┘
```

### Slider Section Layout

Each dimension rendered as:
```
┌─────────────────────────────────────────────────┐
│ Formal ↔ Casual           Somewhat Casual       │ ← Label (left) + Current value (right)
│                                                  │
│ [━━━━●━━━━━━━━━━━━━━━━━━━━━━━━]                │ ← Range slider
│                                                  │
│ Formal                              Casual       │ ← Extreme labels
└─────────────────────────────────────────────────┘
```

**Slider Spacing:** 2rem between each slider (space-y-8)

### Range Slider Specifications

**Track:**
- Height: 8px (h-2)
- Rounded corners
- Gradient fill: Purple (#9333ea) from left to current position, gray (#e5e7eb) for remainder
- Formula: `linear-gradient(to right, #9333ea 0%, #9333ea ${(value/4)*100}%, #e5e7eb ${(value/4)*100}%, #e5e7eb 100%)`

**Thumb:**
- Width/Height: 24px
- Circular (border-radius: 50%)
- Background: Purple (#9333ea)
- White border: 3px
- Box shadow: `0 2px 4px rgba(0,0,0,0.2)`
- Cursor: pointer

### Info Box (Dynamic)

Appears below sliders when any slider is adjusted:

```
┌─────────────────────────────────────────────────┐
│ [ℹ️] Formal ↔ Casual: Somewhat Casual           │ ← Purple (#A855F7) background
│                                                  │    Border: 2px purple (#C084FC)
│ Conversational and friendly. Uses contractions  │
│ freely. Feels like talking to a colleague.      │ ← Description
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Example HR Communication:                   │ │ ← White box with border
│ │ "Hey team! Review season's coming up..."    │ │ ← Italic text
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Background: Purple-50 (#FAF5FF)
- Border: 2px solid Purple-200
- Padding: 1.5rem (p-6)
- Icon: Info icon from Lucide, 20px, Purple-600
- Title: Font semibold, Purple-900
- Description: Purple-800
- Example box: White background, border, padding 1rem

### Sample Communications Section

Appears after Summary, shows 4 generated examples:

```
┌─────────────────────────────────────────────────┐
│ Sample Communications                            │
│ See how your voice settings would sound...      │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ [WELCOME MESSAGE] New hire first day email  │ │ ← Badge + context
│ │                                             │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Hey Sarah!                              │ │ │ ← White box with content
│ │ │                                         │ │ │
│ │ │ Welcome to the team! We're so...       │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [3 more samples follow same pattern]            │
└─────────────────────────────────────────────────┘
```

**Sample Card Styling:**
- Background: Gradient from Purple-50 to Blue-50
- Border: Purple-100
- Padding: 1.25rem (p-5)
- Rounded corners
- Spacing between cards: 1rem (space-y-4)

**Badge:**
- Text: Purple-700
- Background: Purple-100
- Padding: 0.25rem horizontal, 0.5rem vertical
- Rounded
- Font: xs, semibold

**Content Box:**
- White background
- Border: Gray-200
- Padding: 1rem
- Text: Gray-800
- Preserve line breaks (whitespace-pre-line)

### Summary Panel

```
┌─────────────────────────────────────────────────┐
│ Your Brand Voice Profile                        │
│                                                  │
│ ┌─────────────────┐  ┌─────────────────┐       │
│ │ Formal ↔ Casual │  │ Serious ↔ Funny │       │ ← 2-column grid
│ │ Somewhat Casual │  │ Balanced        │       │
│ │ Score: 3/4      │  │ Score: 2/4      │       │
│ └─────────────────┘  └─────────────────┘       │
│                                                  │
│ [2 more dimension cards]                        │
└─────────────────────────────────────────────────┘
```

**Summary Cards:**
- Background: Gray-50
- Padding: 1rem (p-4)
- Rounded corners
- 2-column grid with gap (grid-cols-2 gap-4)
- Dimension name: Small text, Gray-600
- Value label: Bold, Gray-900
- Score: Extra small, Purple-600

### JSON Export (Collapsible)

```
┌─────────────────────────────────────────────────┐
│ ▶ Export as JSON                                │ ← Collapsible details element
│                                                  │
│ {                                                │ ← Code block (when expanded)
│   "dimensional_positioning": {                   │
│     "formality": 3,                              │
│     ...                                          │
│   }                                              │
│ }                                                │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Background: Gray-50
- Padding: 1rem (p-4)
- Rounded corners
- Summary: Font medium, Gray-700, cursor pointer
- Pre block: Extra small text, Dark background (#111827), Green text (#4ADE80)
- Scrollable horizontally if needed

## Behavior Specifications

### Slider Interaction

**On slider change:**
1. Update `dimensions` state with new value
2. Set `activeInfo` to the dimension that was changed
3. Info box immediately updates to show new description and example
4. All 4 sample communications regenerate with new voice settings
5. Summary panel updates to show new value and label
6. Slider track gradient animates to new position

**User Experience:**
- Smooth dragging with visual feedback
- Click anywhere on track to jump to that position
- Keyboard accessible (arrow keys to adjust when focused)

### Info Box Updates

**Trigger:** Any slider movement  
**Behavior:**
- Fade in if not already visible (or smooth update if visible)
- Display info for the dimension that was just adjusted
- Remains visible showing last-adjusted dimension
- Updates instantly as slider moves (no debounce)

### Sample Generation Logic

Samples must regenerate in real-time as sliders move. Each sample considers all four dimensions simultaneously.

#### Sample 1: Welcome Message (New Hire First Day)

**Greeting Generation:**
```
formality <= 1: "Dear [Name],"
formality <= 2: "Hi [Name],"
formality >= 3: "Hey [Name]!"
```

**Opening Line:**
```
enthusiasm >= 3 && formality <= 2: "Welcome to the team! We're thrilled to have you joining us."
enthusiasm >= 3 && formality > 2: "Welcome to the team! We're so excited you're here!"
enthusiasm >= 2: "Welcome to the team. We're glad to have you with us."
enthusiasm < 2: "Welcome to the team."
```

**Main Content:**
```
formality <= 1: "Your onboarding schedule has been prepared and will be sent to your email address. Please review the attached documents prior to your start date."
formality == 2: "We've put together an onboarding schedule for you. You'll find everything in your inbox, including some important documents to review before day one."
formality >= 3: "Your onboarding schedule is in your inbox. Take a look when you get a chance—there are a few docs to check out before you start."
```

**Personality Touch (conditional):**
```
humor >= 3: " (Don't worry, we kept the paperwork to a minimum. Well, minimum-ish.)"
humor == 2 && respect <= 2: " We tried to keep the paperwork reasonable!"
humor < 2: "" (no addition)
```

**Closing:**
```
enthusiasm >= 3 && formality <= 2: "Can't wait to meet you!"
enthusiasm >= 3 && formality > 2: "See you soon!"
enthusiasm == 2: "Looking forward to working with you."
enthusiasm < 2 && formality <= 1: "Regards,"
enthusiasm < 2 && formality > 1: "Thanks,"
```

#### Sample 2: Benefits Reminder (Open Enrollment)

**Opening:**
```
enthusiasm >= 3 && formality <= 2: "Important reminder: Open enrollment closes this Friday!"
enthusiasm >= 3 && formality > 2: "Heads up! Open enrollment wraps up Friday!"
enthusiasm == 2: "Reminder: Open enrollment ends this Friday."
enthusiasm < 2: "Open enrollment closes Friday, December 15 at 5:00 PM."
```

**Main Content:**
```
formality <= 1: "Please log into the benefits portal to review your options and submit your selections before the deadline. Failure to complete enrollment will result in default coverage for the next calendar year."
formality == 2: "Log into the benefits portal to review your options and make your selections. If you don't complete enrollment by the deadline, you'll be automatically enrolled in the default plan."
formality == 3: "Jump into the benefits portal to pick your plans before Friday. If you miss the deadline, we'll enroll you in the default option."
formality >= 4: "Hop into the benefits portal and choose your plans before Friday. Miss it and you'll get auto-enrolled in the default."
```

**Support Section:**
```
humor >= 3: " We know insurance forms are about as fun as watching paint dry, so our benefits team is standing by to help translate the jargon."
humor == 2: " The benefits team is available if you need help making sense of all the options."
enthusiasm >= 2 && humor < 2: " Our benefits team is here to help if you have questions!"
default: " Contact the benefits team with questions."
```

#### Sample 3: Policy Update (Remote Work Policy)

**Opening:**
```
formality <= 1: "Please be advised that the remote work policy has been updated effective January 1, 2025."
formality == 2: "We've updated our remote work policy, effective January 1, 2025."
respect >= 3: "Quick update: We're revising the remote work policy starting January 1."
formality >= 4: "New remote work policy drops January 1."
```

**Change Explanation:**
```
formality <= 1: "The revised policy requires employees to work from the office a minimum of two days per week. Department managers will coordinate specific schedules with their teams."
formality == 2: "The updated policy asks everyone to be in the office at least two days a week. Your manager will work with you to figure out which days work best for your team."
formality >= 3: "Starting in January, we're asking everyone to be in the office two days a week. Your manager will help you pick days that work for your team's schedule."
```

**Rationale (conditional):**
```
respect <= 2 && formality <= 2: " This change supports better collaboration and team connection while maintaining the flexibility you value."
respect <= 2 && formality > 2: " This helps us collaborate better while keeping the flexibility we all appreciate."
respect >= 3 && humor >= 2: " We heard your feedback about missing face-to-face time (and the office coffee machine)."
respect >= 3 && humor < 2: " We've heard your feedback about wanting more in-person collaboration time."
```

**Action Item:**
```
formality <= 1: "Please review the complete policy document attached and direct any questions to Human Resources."
formality == 2: "Check out the full policy in the attachment and reach out to HR if you have questions."
formality >= 3: "Full policy's attached. Hit up HR with any questions."
```

#### Sample 4: Performance Review (Quarterly Review Invitation)

**Opening:**
```
enthusiasm >= 3 && formality <= 2: "It's time for quarterly performance reviews!"
enthusiasm >= 3 && formality > 2: "Review season is here!"
enthusiasm == 2: "It's time for quarterly performance reviews."
enthusiasm < 2: "Quarterly performance reviews will be conducted during the week of March 6-10."
```

**Invitation:**
```
formality <= 1: "You will receive a calendar invitation within 48 hours to schedule your review meeting with your direct manager. Please come prepared to discuss your accomplishments, challenges, and development goals."
formality == 2: "You'll get a calendar invite in the next day or two to schedule time with your manager. Come ready to talk about your wins, challenges, and what you want to work on next."
formality == 3: "Expect a calendar invite soon to book time with your manager. Think about your wins, challenges, and growth goals for the conversation."
formality >= 4: "Calendar invite coming your way to grab time with your manager. Prep your highlights and goals for the chat."
```

**Encouragement (conditional):**
```
enthusiasm >= 3 && humor <= 2: " This is your chance to reflect on your progress and shape your path forward—we're here to support your growth!"
enthusiasm == 2: " Looking forward to celebrating your progress and planning your next steps together."
humor >= 3: " (Pro tip: Now's a great time to update that 'wins' doc you definitely kept updated all quarter, right?)"
default: "" (no addition)
```

## Data Export Format

### JSON Structure
```json
{
  "dimensional_positioning": {
    "formality": 3,
    "humor": 2,
    "respect": 2,
    "enthusiasm": 3
  },
  "labels": {
    "formality": "Somewhat Casual",
    "humor": "Balanced",
    "respect": "Balanced",
    "enthusiasm": "Somewhat Enthusiastic"
  }
}
```

### Export Behavior
- Available via collapsible `<details>` element
- Clicking "Export as JSON" expands to show formatted JSON
- JSON is syntax-highlighted (green text on dark background)
- Code block is scrollable horizontally if content exceeds width
- JSON updates live as sliders move

## Accessibility Requirements

### Keyboard Navigation
- All sliders must be keyboard accessible
- Tab key moves between sliders
- Arrow keys adjust values when slider is focused
- Enter/Space on collapsed details opens JSON export

### Screen Reader Support
- Sliders have proper ARIA labels
- Current value announced when changed
- Info box updates announced to screen readers
- Dimension names clearly associated with controls

### Visual Accessibility
- High contrast between text and backgrounds
- Focus indicators visible on all interactive elements
- Color not the only means of conveying information
- Text readable at minimum 12px (actual implementation uses larger)

## Responsive Behavior

**Note:** This component is designed for desktop use (matching HR workflow builder context). Mobile optimization is not required but component should remain functional on tablets (768px+).

**Breakpoint behavior:**
- Below 768px: Summary grid switches to single column
- Below 640px: Reduced padding, full-width layout
- Sliders remain usable at all screen sizes

## Color Palette

### Primary Colors
- **Purple-50:** #FAF5FF (backgrounds)
- **Purple-100:** #F3E8FF (badges, borders)
- **Purple-200:** #E9D5FF (borders)
- **Purple-600:** #9333EA (primary interactive elements, slider track)
- **Purple-700:** #7E22CE (text accents)
- **Purple-800:** #6B21A8 (body text in info boxes)
- **Purple-900:** #581C87 (headings in info boxes)

### Secondary Colors
- **Blue-50:** #EFF6FF (gradient backgrounds)
- **Gray-50:** #F9FAFB (summary cards, collapsible)
- **Gray-200:** #E5E7EB (borders, slider track inactive)
- **Gray-500:** #6B7280 (secondary text)
- **Gray-600:** #4B5563 (labels)
- **Gray-700:** #374151 (body text)
- **Gray-800:** #1F2937 (sample content)
- **Gray-900:** #111827 (headings, JSON background)

### Functional Colors
- **Green-400:** #4ADE80 (JSON syntax highlighting)
- **White:** #FFFFFF (cards, content boxes)

## Implementation Notes

### Performance Considerations
- Sample generation functions should be memoized or optimized since they run on every slider change
- Consider debouncing if performance issues arise with live generation
- State updates should batch if multiple sliders moved quickly

### Code Organization
```
BrandVoiceSliders/
├── index.jsx                      // Main component export
├── dimensionConfig.js             // Configuration data for all 4 dimensions
├── sampleGenerators/
│   ├── welcomeMessage.js
│   ├── benefitsReminder.js
│   ├── policyUpdate.js
│   └── performanceReview.js
└── styles/
    └── sliders.css                // Custom slider styles
```

### Testing Checklist
- [ ] All sliders update state correctly
- [ ] Info box updates on any slider change
- [ ] All 4 samples regenerate on any slider change
- [ ] Summary panel reflects current values
- [ ] JSON export matches current state
- [ ] Keyboard navigation works for all controls
- [ ] All extreme values (0 and 4) generate appropriate content
- [ ] No console errors or warnings
- [ ] Smooth visual transitions between states
- [ ] Responsive layout doesn't break on tablet sizes

## Future Enhancement Opportunities

### Phase 2 Possibilities (Not Required Now)
- **Preset voices:** Add "Quick Start" presets (e.g., "Startup Casual", "Enterprise Formal", "Healthcare Empathetic")
- **Voice comparison:** Side-by-side view comparing two different voice profiles
- **Save profiles:** Local storage or backend persistence of multiple voice profiles
- **Contextual presets:** Different voice settings for different HR scenarios (recruiting vs policy vs benefits)
- **A/B testing:** Generate multiple variations at once for comparison
- **Voice analyzer:** Upload existing content to reverse-engineer voice settings
- **Team collaboration:** Share voice profiles with teammates
- **Integration:** Direct export to prompt engineering systems or CMS

## Success Metrics

### User Experience
- Users can define a complete voice profile in under 5 minutes
- Generated samples feel authentic and usable without heavy editing
- Voice settings translate clearly to actual communication examples

### Technical
- Slider interactions feel instant (<100ms response time)
- No jank or lag during real-time sample generation
- Clean, maintainable code structure for future enhancements

---

## Quick Start Implementation Guide

1. Set up React component with state management for 4 dimensions
2. Implement slider UI with custom styling for thumbs and tracks
3. Add dimensionConfig data structure with all labels, descriptions, and examples
4. Create info box that displays based on activeInfo state
5. Implement 4 sample generator functions with conditional logic
6. Build summary panel to display current selections
7. Add JSON export with collapsible details element
8. Test all interactions and validate output quality
9. Refine sample generation logic based on testing feedback

**Estimated Implementation Time:** 4-6 hours for experienced React developer