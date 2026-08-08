---
name: Da Profiler
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#181c21'
  surface-container: '#1c2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353b'
  on-surface: '#e0e2ea'
  on-surface-variant: '#c0c7d4'
  inverse-surface: '#e0e2ea'
  inverse-on-surface: '#2d3136'
  outline: '#8b919d'
  outline-variant: '#414752'
  surface-tint: '#a2c9ff'
  primary: '#a2c9ff'
  on-primary: '#00315c'
  primary-container: '#58a6ff'
  on-primary-container: '#003a6b'
  inverse-primary: '#0060aa'
  secondary: '#c1c7d0'
  on-secondary: '#2b3138'
  secondary-container: '#41474f'
  on-secondary-container: '#b0b5be'
  tertiary: '#ffba42'
  on-tertiary: '#432c00'
  tertiary-container: '#da9600'
  on-tertiary-container: '#4f3400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a2c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004882'
  secondary-fixed: '#dde3ec'
  secondary-fixed-dim: '#c1c7d0'
  on-secondary-fixed: '#161c23'
  on-secondary-fixed-variant: '#41474f'
  tertiary-fixed: '#ffddaf'
  tertiary-fixed-dim: '#ffba42'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#101419'
  on-background: '#e0e2ea'
  surface-variant: '#32353b'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 16px
---

## Brand & Style

The design system is engineered for deep-focus technical environments. It prioritizes clarity and high information density without sacrificing aesthetic sophistication. The style is **Corporate Modern** with **Glassmorphic** accents, characterized by a precision-tool feel that reflects the reliability required for performance profiling and debugging.

The visual language utilizes crisp 1px borders and subtle glows to define hierarchy, moving away from heavy shadows in favor of tonal layering. It targets developers and system architects who require a high-contrast environment to quickly parse complex data structures and logs.

## Colors

This design system uses a curated dark palette designed for low eye strain during long sessions.
- **Primary:** A vibrant blue used for calls to action, active states, and highlighting critical paths.
- **Semantic Palette:** Standardized mapping for HTTP methods and system statuses (Green for success/GET, Red for danger/DELETE/error, Yellow for warnings/PUT/POST).
- **Surface Strategy:** Backgrounds follow a "nested-light" logic where the deepest layer is the darkest (#0d1117), and floating containers or cards use slightly lighter values (#21262d) to create natural depth.
- **Interactive Accents:** Active elements should utilize a low-opacity glow using the primary color hex with 15-20% opacity.

## Typography

The typography system is split between **Inter** for administrative and UI tasks and **JetBrains Mono** for technical data.
- **UI Text:** Use Inter for all navigational elements, buttons, and labels. Tighten letter spacing on headlines for a more "designed" look.
- **Technical Text:** Use JetBrains Mono for API endpoints, SQL queries, stack traces, and JSON payloads.
- **Hierarchy:** Ensure a clear distinction between data labels (Label-Caps) and the data itself (Code-MD).

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for dashboards and a **Fluid** model for code editors and log streams.
- **Grid:** Use a 12-column grid for dashboard views with 16px gutters.
- **Density:** Maintain high information density by using 8px (sm) and 12px (between sm and md) spacing for internal component padding, while keeping 24px (lg) margins between major sections to prevent visual clutter.
- **Sidebars:** Fixed-width sidebars (240px to 280px) are preferred to maximize the horizontal space for wide code blocks.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **1px Outlines** rather than traditional shadows.
- **Layer 0:** Main application background (#0d1117).
- **Layer 1:** Content areas, sidebars, and gutters (#161b22) with a 1px border (#30363d).
- **Layer 2:** Floating cards, modals, and tooltips (#21262d) with a slightly brighter 1px border (#444c56).
- **Active State:** When an element is focused or active, apply a 2px outer glow using the primary color at 20% opacity. 
- **Backdrop:** Use a 12px blur for modal backdrops to maintain context of the background data.

## Shapes

The shape language is strictly geometric. 
- **Small Components:** Checkboxes and small tags use `rounded-sm` (4px).
- **Standard Components:** Buttons, inputs, and list items use `rounded-md` (8px).
- **Containers:** Large cards and modals use `rounded-lg` (12px).
- **Profile/Avatars:** Circles are used exclusively for user or service identity icons.

## Components

- **Buttons:** Solid primary buttons use white text on vibrant blue. Ghost buttons use 1px borders with the primary color for text.
- **Inputs:** Dark backgrounds (#0d1117) with 1px borders (#30363d). On focus, the border changes to the primary blue with a subtle outer glow.
- **Chips/Badges:** Used for HTTP methods. Ensure the background is a 15% opacity version of the semantic color with a solid 1px border of the same color.
- **Data Tables:** Remove vertical borders. Use horizontal dividers (#30363d). Hover states for rows should use a subtle highlight (#161b22).
- **Code Blocks:** Use a separate background (#0d1117) for code blocks within cards to create an inset look. Use JetBrains Mono for all content.
- **Lists:** High-density lists (e.g., log entries) should have a 32px minimum height with `body-sm` typography.