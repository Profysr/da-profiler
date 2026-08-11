---
name: Proton Density
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#e1bfb5'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#a88a81'
  outline-variant: '#594139'
  surface-tint: '#ffb59d'
  primary: '#ffb59d'
  on-primary: '#5d1900'
  primary-container: '#ff6c37'
  on-primary-container: '#5f1a00'
  inverse-primary: '#ac3500'
  secondary: '#a4c8ff'
  on-secondary: '#00315d'
  secondary-container: '#1e92ff'
  on-secondary-container: '#002a52'
  tertiary: '#4be173'
  on-tertiary: '#003913'
  tertiary-container: '#00b24d'
  on-tertiary-container: '#003b14'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#004784'
  tertiary-fixed: '#6cff8c'
  tertiary-fixed-dim: '#4be173'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#005320'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  panel-gap: 0px
  container-padding: 12px
  element-gap: 8px
  tight-gap: 4px
  sidebar-width: 260px
  header-height: 48px
---

## Brand & Style

This design system is engineered for power users who require high information density and structural clarity. It adopts a **Corporate / Modern** aesthetic with a heavy emphasis on **Flat Design** and **Panel-based Architecture**. 

The UI prioritizes utility over decoration, utilizing clean, distinct borders to separate complex workspaces. The emotional response is one of precision, efficiency, and technical reliability. By avoiding shadows and gradients, the system ensures that every pixel serves a functional purpose, allowing developers to scan large datasets and complex API configurations with minimal cognitive load.

## Colors

The palette is functional and semantic. The primary "Postman Orange" is used sparingly for key actions and active states to prevent visual fatigue. 

- **Semantic Actions:** Specific hex codes are assigned to HTTP methods (GET, POST, etc.) and system statuses to allow for instant recognition.
- **Surface Strategy:** Layers are defined by hex shifts rather than shadows. In dark mode, the base workspace is darker (#212121) while active panels and modals are slightly lighter (#2b2b2b).
- **Borders:** Low-contrast borders are the primary method of separation, ensuring the UI feels organized but not "heavy."

## Typography

The typography system is optimized for **density and legibility**. 

- **UI Elements:** Inter is used for all navigational elements, menus, and labels. Small font sizes (12px-13px) are the standard to maximize the viewable data area.
- **Technical Content:** JetBrains Mono is strictly reserved for code blocks, URL bars, keys/values in tables, and environment variables. This mono-spacing helps in aligning technical data vertically.
- **Hierarchy:** Contrast is achieved through weight (Medium/SemiBold) and color (Secondary Text) rather than large scale changes in font size.

## Layout & Spacing

This design system uses a **Fixed-Panel Grid** model. The layout is divided into high-level functional areas:
1. **Global Header:** Persistent 48px bar for workspace switching and settings.
2. **Sidebar:** Fixed 260px width for navigation (Collections, History, Environments).
3. **Main Workbench:** A multi-pane view divided by draggable splitters.

**Spacing Rhythm:** 
- A compact 4px/8px/12px scale is used. 
- Panels should have `0px` gaps between them, separated only by `1px` borders to maintain a "sheet" effect.
- Content within panels should use `12px` padding for general containers and `4px` for tight interactive lists.

## Elevation & Depth

This system avoids ambient shadows entirely to maintain a flat, technical look. Depth is communicated through:
- **Tonal Layering:** Active tabs or focused panels use the `bg_surface` color, while the background remains `bg_base`.
- **Border Reinforcement:** 1px solid borders using the `border` token define the perimeter of all interactive areas.
- **Z-Index Modals:** When a modal or dropdown is required, it uses a solid `1px` border with a slightly darker background than the surface beneath it to simulate "resting on top" without a shadow.

## Shapes

The shape language is strictly **Soft (0.25rem)**. 
- Primary UI elements like buttons, input fields, and chips use a `4px` radius. 
- Main workspace panels and large containers should remain **Sharp (0px)** where they touch the edge of the screen or other panels to reinforce the modular, grid-like structure.
- Tabs use a "folder" shape with top-only rounding of `4px`.

## Components

### Buttons
- **Primary:** Background `primary_color_hex`, text white, no shadow.
- **Ghost:** No background, border `transparent` until hover, then `bg_surface`. Use for utility icons.
- **Method Badges:** Solid background using status colors (GET, POST), white text, bold weight, JetBrains Mono font.

### Input Fields
- **Standard:** Background `bg_base`, 1px border `border`. On focus, border changes to `primary_color_hex`.
- **Key-Value Rows:** Minimalist design with no vertical borders, only a bottom border to separate rows in a table.

### Tabs (Workbench)
- **Active:** `bg_surface` background, `primary_color_hex` 2px top-border, primary text.
- **Inactive:** `bg_base` background, secondary text, 1px border `border`.

### Lists & Trees
- High density (24px-28px row height).
- Hover state: `bg_surface`.
- Active state: Left-accent border (2px) of `primary_color_hex`.

### Cards / Panels
- No shadows. 
- Solid 1px border.
- Header area for panels should have a slightly different background tint or a bottom-border to separate it from the panel content.