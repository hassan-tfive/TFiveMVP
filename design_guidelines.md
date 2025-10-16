# Tfive Design Guidelines

## Design Approach

**Selected Approach:** Hybrid Design System
- **Foundation:** Material Design 3 principles for enterprise credibility and accessibility
- **Creative Layer:** Custom elements inspired by Linear (clean typography, subtle interactions) and Oboe (minimal, breathing layouts)
- **Justification:** Tfive requires professional trust for enterprise clients while maintaining the warmth and engagement needed for personal development. The dual workspace architecture demands clear visual distinction, making a systematic approach with custom flourishes ideal.

**Core Design Principles:**
1. **Focus-First:** Every interface element supports the 25-minute concentration cycle
2. **Privacy-Conscious:** Visual cues clearly distinguish Professional vs Personal spaces
3. **Progress-Visible:** Gamification that feels mature, not juvenile
4. **Conversational:** AI companion "Tairo" feels present, helpful, and intelligent

---

## Color Palette

### Professional Workspace
**Light Mode:**
- Primary: 220 90% 56% (Trustworthy blue)
- Surface: 0 0% 100% (Pure white)
- Surface Secondary: 220 20% 97% (Subtle blue-gray)
- Text Primary: 220 20% 15%
- Text Secondary: 220 15% 45%

**Dark Mode:**
- Primary: 220 90% 65% (Brighter blue for contrast)
- Surface: 220 15% 11% (Deep blue-black)
- Surface Secondary: 220 15% 16%
- Text Primary: 220 20% 95%
- Text Secondary: 220 10% 70%

### Personal Workspace
**Light Mode:**
- Primary: 280 70% 60% (Calming purple)
- Accent: 160 60% 50% (Growth green - for Earn rewards)
- Surface: 280 10% 98%
- Surface Secondary: 280 15% 94%

**Dark Mode:**
- Primary: 280 70% 68%
- Accent: 160 60% 58%
- Surface: 280 12% 12%
- Surface Secondary: 280 12% 17%

### Universal Elements
- Success: 142 76% 45%
- Warning: 38 92% 50%
- Error: 0 84% 60%
- Timer Active: 25 95% 58% (Pomodoro tomato red)

---

## Typography

**Font Families:**
- Primary: 'Inter' (UI, body text, navigation)
- Display: 'Sora' (Headlines, hero sections, session titles)
- Mono: 'JetBrains Mono' (Timer display, code snippets)

**Scale:**
- Hero: 3.5rem (56px) / 600 weight
- H1: 2.5rem (40px) / 600 weight
- H2: 2rem (32px) / 600 weight
- H3: 1.5rem (24px) / 600 weight
- Body Large: 1.125rem (18px) / 400 weight
- Body: 1rem (16px) / 400 weight
- Small: 0.875rem (14px) / 400 weight
- Timer: 4rem (64px) / 700 weight (Mono)

**Line Height:** 1.5 for body text, 1.2 for headlines

---

## Layout System

**Spacing Units:** Consistent use of Tailwind spacing in multiples of 4
- Tight: p-2, gap-2 (8px) - Button internals, tight lists
- Standard: p-4, gap-4 (16px) - Card padding, component spacing
- Comfortable: p-6, gap-6 (24px) - Section padding, generous breathing room
- Loose: p-8, gap-8 (32px) - Major section dividers

**Container Widths:**
- Admin Dashboard: max-w-7xl (1280px)
- Chat Interface: max-w-4xl (896px)
- Program Content: max-w-3xl (768px)
- Reading Content: max-w-prose (65ch)

**Grid System:**
- Admin: 12-column grid for data tables and dashboards
- Programs: 3-column on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Chat: Single column with max-width constraint

---

## Component Library

### Navigation
**Workspace Switcher:** Prominent toggle between Professional/Personal with distinct color coding and subtle background shift animation
**Primary Nav:** Sidebar (collapsible on mobile) with icon + label pattern, active state with colored indicator bar
**Breadcrumbs:** For deep navigation in admin and program paths

### AI Chat Interface
**Message Bubbles:** 
- User: Right-aligned, primary color background, white text
- Tairo (AI): Left-aligned, surface secondary background, with subtle "Tairo" avatar icon
- Typing indicator: Three animated dots in Tairo's color
**Input Area:** Fixed bottom bar with auto-expanding textarea, send button, session controls

### Pomodoro Timer Components
**Timer Display:** Large mono font, circular progress ring around numbers, color shifts: blue (Learn) → green (Act) → gold (Earn)
**Session Card:** Shows current phase, time remaining, next action preview
**Progress Bar:** Linear indicator below timer showing overall session completion

### Program Cards
**Structure:** Image thumbnail (or gradient if none), program title, duration badge, difficulty indicator, progress ring
**Hover State:** Subtle elevation increase, slight scale (1.02x)
**Completion Badge:** Checkmark overlay on completed programs

### Gamification Elements
**Points Display:** Animated counter with celebratory micro-interaction on gain
**Level Badge:** Shield or ribbon design with current level number
**Achievement Cards:** Icon + title + description, unlocked state has color, locked is grayscale
**Leaderboard:** Clean table with rank, avatar, name, points columns

### Admin Dashboard
**Stat Cards:** Large number, label, trend indicator (↑ green or ↓ red), sparkline chart
**Data Tables:** Sortable headers, row hover states, pagination controls
**Team Management:** Avatar grid with hover overlay showing member details

### Forms & Inputs
**Text Fields:** Subtle border in surface secondary, focus state with primary color border, dark mode compatible
**Dropdowns:** Native-looking selects with custom styling
**Checkboxes/Radio:** Custom styled to match primary color
**Action Buttons:** Solid primary for CTAs, outline for secondary, ghost for tertiary

---

## Images

### Hero Section (Landing/Marketing)
**Large Hero Image:** Professional team collaborating in modern workspace, aspirational but authentic
- Placement: Full-width hero spanning 70vh
- Treatment: Subtle gradient overlay (primary color at 20% opacity) for text readability
- Buttons on hero: Use blurred backgrounds for outline variants

### Program Thumbnails
**Session Images:** Abstract calming visuals (nature, light patterns, geometric shapes) representing program themes
- Wellbeing: Soft nature scenes
- Recovery: Warm, supportive imagery
- Inclusion: Diverse, welcoming compositions
- Each image has consistent aspect ratio 16:9

### Dashboard Illustrations
**Empty States:** Simple, friendly line illustrations when no data exists
**Onboarding:** Step-by-step illustrated guides for first-time workspace setup

---

## Animations

**Use Sparingly:**
- Page transitions: Simple fade (150ms)
- Timer countdown: Smooth number flip
- Achievement unlock: Single celebratory pop-in with scale
- Workspace switch: Gentle fade + slight slide (200ms)
- Message send: Quick slide-up into position

**Avoid:** Continuous animations, distracting hover effects, unnecessary micro-interactions

---

## Accessibility & Dark Mode

- All form inputs maintain readable contrast in both modes
- Dark mode uses true dark backgrounds (not gray) with adjusted primary colors for sufficient contrast
- Focus states clearly visible with 2px outline in primary color
- Timer and critical information uses high-contrast colors
- Touch targets minimum 44x44px for mobile

---

## Visual Hierarchy Principles

1. **Workspace Identity:** Color and subtle background texture immediately communicate which space user is in
2. **Session Focus:** Timer and current activity always prominent, supporting info recedes
3. **Progress Front-and-Center:** Points, levels, completion states visible but never overwhelming
4. **Tairo's Presence:** AI companion icon and name consistent across platform, feels like a guide not a robot