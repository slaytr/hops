# hops Design System

## Overview
This document defines the design language for the hops hotel operations platform. It ensures consistency across the application and serves as a reference for future development.

## Brand Identity

### Brand Color: Teal
- **Primary Purpose**: Actions, highlights, active states, branding
- **Light Mode**: Darker teal for better contrast on light backgrounds
- **Dark Mode**: Lighter teal for visibility on dark backgrounds

## Color Palette

### Light Mode

#### Primary (Teal)
- `--color-primary`: `#00897B` - Main brand color (darker teal)
- `--color-primary-hover`: `#00695C` - Hover states
- `--color-primary-light`: `#B2DFDB` - Backgrounds, subtle highlights
- `--color-primary-dark`: `#004D40` - Text on light backgrounds

#### Backgrounds
- `--color-background`: `#F5F5F5` - Main background (muted, not pure white)
- `--color-background-soft`: `#E8E8E8` - Cards, containers
- `--color-background-mute`: `#DADADA` - Subtle backgrounds

#### Text
- `--color-text`: `#212121` - Primary text
- `--color-text-soft`: `#616161` - Secondary text
- `--color-heading`: `#000000` - Headings

#### Borders
- `--color-border`: `#E0E0E0` - Default borders
- `--color-border-hover`: `#BDBDBD` - Hover state borders

### Dark Mode

#### Primary (Teal)
- `--color-primary`: `#4DB6AC` - Main brand color (lighter teal)
- `--color-primary-hover`: `#80CBC4` - Hover states
- `--color-primary-light`: `#26A69A` - Backgrounds, subtle highlights
- `--color-primary-dark`: `#00897B` - Text on dark backgrounds

#### Backgrounds
- `--color-background`: `#121212` - Main background
- `--color-background-soft`: `#1E1E1E` - Cards, containers
- `--color-background-mute`: `#2C2C2C` - Subtle backgrounds

#### Text
- `--color-text`: `#E0E0E0` - Primary text
- `--color-text-soft`: `#B0B0B0` - Secondary text
- `--color-heading`: `#FFFFFF` - Headings

#### Borders
- `--color-border`: `#333333` - Default borders
- `--color-border-hover`: `#4A4A4A` - Hover state borders

## Semantic Colors

### Status Colors (Both Modes)
- **Success**: Green shades for completed, available states
- **Warning**: Orange/amber for maintenance, high priority
- **Error**: Red for cancelled, urgent states
- **Info**: Blue for in-progress, informational states

### Task Status Colors

#### Light Mode
- `--status-pending`: `#757575` (Gray)
- `--status-in-progress`: `#1976D2` (Blue)
- `--status-completed`: `#388E3C` (Green)
- `--status-cancelled`: `#D32F2F` (Red)

#### Dark Mode
- `--status-pending`: `#9E9E9E` (Gray)
- `--status-in-progress`: `#42A5F5` (Blue)
- `--status-completed`: `#66BB6A` (Green)
- `--status-cancelled`: `#EF5350` (Red)

## Typography

### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace**: 'Fira Code', 'Courier New', monospace (for room numbers, IDs)

### Font Sizes
- `--font-size-xs`: `0.7rem` (11.2px)
- `--font-size-sm`: `0.8rem` (12.8px)
- `--font-size-base`: `0.85rem` (13.6px)
- `--font-size-md`: `0.95rem` (15.2px)
- `--font-size-lg`: `1rem` (16px)
- `--font-size-xl`: `1.25rem` (20px)
- `--font-size-2xl`: `1.5rem` (24px)

### Font Weights
- `--font-weight-normal`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`

## Spacing Scale

- `--spacing-xs`: `0.25rem` (4px)
- `--spacing-sm`: `0.5rem` (8px)
- `--spacing-md`: `0.75rem` (12px)
- `--spacing-lg`: `1rem` (16px)
- `--spacing-xl`: `1.5rem` (24px)
- `--spacing-2xl`: `2rem` (32px)

## Layout

### Calendar Grid
- **Room Column Width**: `120px` (fixed)
- **Date Column Width**: `100px` (fixed)
- **Row Min Height**: `3rem` (auto-expand for content)

### Container Padding
- **Default**: `1rem`
- **Form Containers**: `1.5rem`
- **Cards**: `1rem`

## Components

### Buttons

#### Primary Button
- Background: `var(--color-primary)`
- Text: `#FFFFFF`
- Hover: `var(--color-primary-hover)`
- Padding: `0.5rem 1rem`
- Border Radius: `4px`

#### Secondary Button
- Background: `var(--color-background-soft)`
- Border: `1px solid var(--color-border)`
- Text: `var(--color-text)`

### Task Blocks
- Border-left: `2px solid` (status color)
- Border-radius: `3px`
- Padding: `0.3rem 0.4rem`
- Font-size: `0.7rem`
- Cursor: `move` (draggable)

### Forms
- Input/Select height: `2.5rem`
- Border: `1px solid var(--color-border)`
- Focus border: `var(--color-primary)`
- Border-radius: `4px`

### Navigation Tabs
- Tab height: `~40px`
- Font size: `0.85rem`
- Icon-text gap: `0.4rem`
- Active text color: `var(--color-primary)`
- Hover text color: `var(--color-heading)` (non-active)
- **Active Indicator**:
  - Height: `2px`
  - Color: `var(--color-primary)`
  - Position: Absolute, bottom-aligned
  - Animation: `0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy ease)
  - Transitions: `left` and `width` properties

### Settings Sub-Navigation
- Padding: `0.4rem 0.75rem`
- Border-radius: `4px`
- Active background: `var(--color-primary-light)`
- Active text: `var(--color-primary-dark)`
- Hover background: `var(--color-background-soft)` (non-active)

### Theme Toggle
- Size: `2.5rem × 2.5rem`
- Icon: `codicon-color-mode`
- Icon size: `1.1rem`
- Border: `1px solid var(--color-border)`
- Border-radius: `4px`
- **Hover States** (preview opposite theme):
  - Light mode hover: `background: #121212`, `color: #FFFFFF`
  - Dark mode hover: `background: #F5F5F5`, `color: #1A1A1A`
- Transform on hover: `scale(1.05)`
- Transition: `all 0.2s`

## Icons

### Icon System
- **Library**: Codicons (VS Code icons)
- **Size**: `1rem` (16px) default
- **Color**: Inherits from parent or `var(--color-text)`

### Common Icons
- Calendar: `codicon-calendar`
- Settings: `codicon-settings-gear`
- Task types: Emoji fallback (🧹 🔧 🔍 🛏️)

## Accessibility

### Contrast Ratios
- Normal text: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

### Focus States
- All interactive elements must have visible focus indicators
- Focus ring: `2px solid var(--color-primary)` with `2px offset`

### Motion
- Respect `prefers-reduced-motion` for animations
- Transitions: `200ms ease` (default)

## Dark Mode Implementation

### Theme Switching
- **System Preference**: Respects `@media (prefers-color-scheme: dark)`
- **Manual Override**: Theme toggle button in header (top-right)
- **Persistence**: User preference saved to `localStorage` as `'hops-theme'`
- **Attribute**: Applied via `data-theme="light|dark"` on `:root`

### Theme Toggle Behavior
1. User clicks theme toggle button
2. Theme switches: `light` ↔ `dark`
3. Preference saved to `localStorage`
4. CSS variables update via `[data-theme]` attribute
5. Hover preview shows opposite theme colors

### CSS Implementation
```css
/* Default: Light mode */
:root { /* light mode variables */ }

/* System preference: Dark mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark mode variables */ }
}

/* Manual override: Dark mode */
:root[data-theme="dark"] { /* dark mode variables */ }
```

### Testing
- Ensure all components work in both modes
- Check contrast ratios in both modes
- Test with system dark/light OS settings
- Test manual toggle with page refresh (persistence)
- Verify hover preview shows correct opposite theme

## Animation Specifications

### Navigation Tab Indicator
**Animation Curve**: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Duration**: `0.4s`
- **Effect**: Slow start, sharp acceleration, soft bounce finish
- **Properties**: Animates `left` and `width` for sliding effect
- **Purpose**: Provides fluid, playful feedback when switching tabs

### Standard Transitions
- **Default**: `0.2s ease` for color, background changes
- **Interactive elements**: `0.2s` for hover states
- **Theme switching**: `0.5s` for background-color and text color

### Motion Principles
- Animations should feel responsive, not sluggish
- Bouncy effects only for primary interactions (tab switching)
- Subtle transitions for secondary elements
- Respect `prefers-reduced-motion` media query

## Protected Components

> ⚠️ **IMPORTANT**: The following components have finalized designs. Changes to global styles or design tokens should NOT affect these components without explicit approval.

### Header Navigation (App.vue)
**Status**: ✅ **FINALIZED**

**Protected Elements**:
- Main navigation tabs (Calendar, Settings)
- Sliding tab indicator animation
- Theme toggle button
- Icon alignment and spacing

**Why Protected**:
These components have carefully tuned animations and interactions. Changes to spacing, colors, or transitions could break the polished UX.

**Safe Changes**:
- Adding new tabs (follow existing pattern)
- Updating icon choices (maintain size and alignment)

**Unsafe Changes**:
- Modifying tab indicator animation curve
- Changing hover state colors for theme toggle
- Adjusting icon-text alignment
- Changing tab spacing or padding

### Theme Toggle Hover Preview
**Status**: ✅ **FINALIZED**

**Protected Behavior**:
- Light mode hover shows dark theme colors (`#121212` background, `#FFFFFF` icon)
- Dark mode hover shows light theme colors (`#F5F5F5` background, `#1A1A1A` icon)

**Rationale**: This provides users with a preview of the theme they're switching to, which is intentional UX design.

**Do NOT**:
- Change hover colors to use `--color-primary`
- Remove the scale transform
- Modify the transition timing

### Tab Indicator Animation
**Status**: ✅ **FINALIZED**

**Protected Values**:
- Cubic-bezier: `(0.34, 1.56, 0.64, 1)` - Creates bounce effect
- Duration: `0.4s`
- Height: `2px`
- Color: `var(--color-primary)`

**Rationale**: This specific curve creates a fluid, bouncy animation that feels premium and responsive.

**Do NOT**:
- Simplify to standard easing (e.g., `ease-in-out`)
- Change duration to be faster/slower
- Remove the bounce effect

## Design Principles

1. **Clarity**: Information should be easy to scan and understand
2. **Efficiency**: Minimize clicks and cognitive load
3. **Consistency**: Use patterns consistently across the app
4. **Compactness**: Maximize information density without clutter
5. **Accessibility**: Ensure usability for all users

## Implementation Status

### Completed Features
- [x] Manual theme toggle with preview on hover
- [x] Light/Dark mode with system preference detection
- [x] Animated tab indicator with bounce effect
- [x] Codicons integration
- [x] Muted light mode backgrounds

### Future Considerations

- [ ] Additional color themes (blue, purple)
- [ ] High contrast mode
- [ ] Customizable accent colors
- [ ] Print stylesheet
- [ ] Mobile responsive breakpoints
- [ ] Animation preferences (respect prefers-reduced-motion)
