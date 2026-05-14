---
name: Njerka
description: Holistic health dashboard with AI-powered meal plans, workouts, and progress tracking
colors:
  forest-canopy: "#15803d"
  forest-deep: "#166534"
  forest-floor: "#f0fdf4"
  forest-mist: "#bbf7d0"
  peak-white: "#ffffff"
  summit-black: "#0f172a"
  trail-gray: "#475569"
  gravel: "#64748b"
  dust: "#94a3b8"
  limestone: "#e2e8f0"
  stone: "#f1f5f9"
  pebble: "#f8fafc"
  ember: "#ef4444"
  warning-amber: "#d97706"
typography:
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.25
  heading:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.025em"
rounded:
  container: "1.5rem"
  card: "1rem"
  field: "0.75rem"
  button: "0.75rem"
  pill: "9999px"
  sm: "0.5rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  xxl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.forest-canopy}"
    textColor: "{colors.peak-white}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
    textColor: "{colors.peak-white}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.trail-gray}"
    rounded: "{rounded.button}"
    padding: "0.75rem 1.5rem"
  input-field:
    backgroundColor: "{colors.pebble}"
    textColor: "{colors.summit-black}"
    rounded: "{rounded.field}"
    padding: "0.75rem 1rem"
  card-default:
    backgroundColor: "{colors.peak-white}"
    textColor: "{colors.summit-black}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
---

# Design System: Njerka

## 1. Overview

**Creative North Star: "The Field Journal"**

Njerka's interface feels like a field journal kept by a seasoned guide — grounded, observant, never performative. Every screen documents progress rather than selling it. The forest-green accent anchors interactive moments without dominating; the generous whitespace lets each day's entry breathe.

The system explicitly rejects three families: cold clinical white-on-white (no warmth, no texture), noisy gamified fitness trackers (constant badges and popups), and dark-mode gym bro aesthetics (black/orange, aggressive typography). Instead it sits in a fourth lane: the naturalist's notebook. Structured but not rigid. Clean but not sterile. Quiet but present.

**Key Characteristics:**

- Generous rounded corners (1.5rem for containers) signal approachability
- Forest-green accent at 30-40% of interactive surfaces
- Flat surfaces with subtle borders; shadow reserved for modals and elevated states
- Dense information structured through clear vertical rhythm, not card nesting
- Motion is restrained — state transitions only, no choreography

## 2. Colors: The Trail Palette

The palette takes cues from a forest trail at dawn — deep canopy greens, warm stone neutrals, and occasional ember for warnings. The green is committed across interactive surfaces (buttons, active tabs, links, badges) at roughly 30-40% coverage. Neutrals carry a warm-stone undertone, not a cool navy-gray.

### Primary

- **Forest Canopy** (#15803d / green-700): The accent. Used for primary CTAs, active navigation, submit buttons, success badges, and any foreground interactive element. Never used as a background behind body text (insufficient contrast at small sizes).
- **Forest Deep** (#166534 / green-800): Hover and pressed states for Forest Canopy surfaces. Also used for gradient overlays or footer sections.
- **Forest Floor** (#f0fdf4 / green-50): Tinted background for active cards, selected states, or success alerts. Pairs with Forest Canopy text.
- **Forest Mist** (#bbf7d0 / green-200): Subtle borders on green-tinted surfaces. Rare.

### Neutral

- **Peak White** (#ffffff / white): Primary surface color. Cards, modals, sidebar, input backgrounds at rest.
- **Stone** (#f1f5f9 / slate-100): Secondary surface. Used for hover states, collapsed sections, feed item backgrounds.
- **Pebble** (#f8fafc / slate-50): Input field background. One step off white.
- **Limestone** (#e2e8f0 / slate-200): Borders, dividers, and disabled state edges.
- **Dust** (#94a3b8 / slate-400): Placeholder text, disabled labels, secondary icons.
- **Gravel** (#64748b / slate-500): Secondary body text, muted metadata.
- **Trail Gray** (#475569 / slate-600): Primary body text.
- **Summit Black** (#0f172a / slate-900): Headings, titles, high-emphasis text.

### Accent (Destructive)

- **Ember** (#ef4444 / red-500): Destructive actions (delete, logout, error states). Used sparingly. Not a surface color.

### Named Rules

**The Forest Floor Rule.** Green-tinted backgrounds (Forest Floor) must never appear on the same surface as a green button. One green element per containment层级. Two greens compete.

**The Ember Limit.** Red is used for destructive actions only. Never for decoration, never for links, never for branding. One context per session.

## 3. Typography

**Body Font:** System sans-serif stack (`ui-sans-serif, system-ui, sans-serif`)

**Character:** Calm and legible. No decorative flourishes. The type gets out of the way and lets the content speak. Weight contrast does the hierarchy work.

### Hierarchy

- **Title** (700, clamp(1.5rem, 4vw, 1.875rem), 1.25): Page-level headings. One per screen.
- **Heading** (700, 1.125rem, 1.4): Section headers inside cards, modal titles, feed post usernames.
- **Body** (400, 0.875rem, 1.6): The majority of readable content. Post text, descriptions, form labels. Max line length 65-75ch.
- **Label** (600, 0.75rem, 1.5, 0.025em letter-spacing): Form labels, badges, timestamps, tab labels. Uppercase only for specific pill badges.

### Named Rules

**The Size Step Rule.** Scale steps below 0.75rem are prohibited. If content needs to be smaller, rewrite it. There is no micro copy.

## 4. Elevation

The system uses a hybrid approach: flat by default, shadowed by state. Most surfaces (cards, containers, sidebars) sit flat with a single subtle border (rgba(0,0,0,0.1)) separating them from adjacent surfaces. Shadows appear only as a deliberate response to interaction or hierarchy.

### Shadow Vocabulary

- **Modal Elevation** (`0 25px 50px -12px rgba(0,0,0,0.25)`): Used for modals, dialogs, and popovers. The only surface that genuinely lifts.
- **Hover Glow** (`0 4px 12px rgba(0,0,0,0.08)`): Applied to interactive cards on hover. Gently suggests the surface can be acted upon.

### Named Rules

**The Flat-By-Default Rule.** At rest, every surface should look like it belongs on the page, not floating above it. If removing all shadows does not break visual separation, the layout is doing its job.

## 5. Components

### Buttons

- **Shape:** Rounded (0.75rem / 12px radius). Full-width on mobile, inline on desktop.
- **Primary (Forest Canopy / white text):** `background: #15803d`, `color: #ffffff`, padding: 12px 24px. Hover shifts to Forest Deep (#166534). Disabled drops to 50% opacity.
- **Ghost / Text:** Transparent background, Trail Gray text. Hover gets a Stone (#f1f5f9) background. Used for secondary or dismiss actions.
- **Destructive (Ember):** Same shape and padding as Primary, background #ef4444. Hover darkens. Only for irreversible actions.

All buttons include a 0.2s ease-out transition on background-color. No scale transforms, no ripple effects.

### Inputs / Fields

- **Style:** Pebble (#f8fafc) background, Limestone (#e2e8f0) border, 0.75rem radius. Padding 12px 16px.
- **Focus:** Ring appears (2px Forest Mist / green-200, with offset). No border color change.
- **Disabled:** Pebble background, Dust text, cursor-not-allowed. Border shifts to Limestone.
- **Error:** Ember border (#ef4444) + Ember text for the error message below.

### Cards / Containers

- **Corner Style:** Rounded (1rem / 16px). Large containers (modals, feed sections) use 1.5rem.
- **Background:** Peak White (#ffffff).
- **Shadow:** None at rest. Optional shadow on hover for interactive cards.
- **Border:** Limestone (1px solid #e2e8f0) for default cards.
- **Internal Padding:** 1.5rem (24px) on all sides. Reduced to 1rem inside nested lists.

### Modals / Dialogs

- **Background:** Peak White, 1.5rem rounded corners.
- **Shadow:** Modal Elevation (`0 25px 50px -12px rgba(0,0,0,0.25)`).
- **Overlay:** Black at 50% opacity with backdrop-blur-sm.
- **Padding:** 1.5-2rem. Title is Summit Black bold, body is Trail Gray regular.
- **Width:** Max 32rem (512px) for small dialogs, 36rem (576px) for content modals.

### Navigation

- **Sidebar-style:** Text links with Summit Black text, 0.875rem, 600 weight. Active state uses Forest Canopy text. Hover uses Stone background.
- **Tab-style (inline):** Pill-shaped segments with white background. Active tab gets Forest Canopy background with white text. Inactive tabs get Dust text.

## 6. Do's and Don'ts

### Do:

- **Do** use Forest Canopy for one primary action per view. Multiple primary buttons dilute intent.
- **Do** keep flat surfaces flat. If a card doesn't need a shadow, don't add one.
- **Do** use the full 1.5rem container radius for modals and large feed cards. The generous curve is a signature.
- **Do** disable form controls during async operations. Show a Loader2 spinner inside the primary button.
- **Do** prefer inline validation over modal error dialogs.
- **Do** use toast for success/error feedback. Never use a modal to confirm success.
- **Do** let whitespace carry the rhythm. Same padding everywhere is monotony; vary spacing by context.

### Don't:

- **Don't** use green-100 or green-50 as button backgrounds. Forest Canopy is the only green button.
- **Don't** use gradient text (`background-clip: text`). Single solid colors only.
- **Don't** use glassmorphism (blurs + glass cards) as default treatment.
- **Don't** put border-left or border-right greater than 1px as a colored accent stripe on cards or callouts.
- **Don't** use the hero-metric template (big number, small label, gradient accent). Show metrics in context, not as decoration.
- **Don't** nest cards. If a card needs an internal container, use a tonal background shift (Pebble or Stone) instead of a nested border.
- **Don't** open a modal when inline expansion would suffice.
- **Don't** animate layout properties (width, height, top, left). Use opacity, transform, and clip-path.
