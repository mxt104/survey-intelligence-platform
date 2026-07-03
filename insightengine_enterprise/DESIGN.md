---
name: InsightEngine Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#41485e'
  on-tertiary: '#ffffff'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 18px
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
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style
The design system is engineered for high-stakes B2B decision-making, where clarity and speed of information processing are paramount. The aesthetic is rooted in **Modern Corporate Minimalism**, drawing inspiration from the precision of developer tools and the clean sophistication of financial platforms. 

The system prioritizes functional density over decorative elements. It utilizes ample white space, a disciplined color application, and a rigorous adherence to grid systems to create an environment of trust and professional competence. The goal is to make complex data feel manageable and "light" while maintaining the structural integrity required for enterprise-grade software.

## Colors
This design system utilizes a high-clarity light mode palette. 

- **Primary Background**: Pure White (#FFFFFF) is used for the main workspace and cards to maximize contrast.
- **Secondary Background**: Soft Gray (#F8FAFC) provides subtle differentiation for sidebar navigation and page headers.
- **Accents**: Indigo is the primary driver for action and focus, while Teal is reserved for secondary data visualizations or subtle highlights.
- **Text Hierarchy**: We use three distinct tiers of slate-based grays to guide the eye from critical data to supporting metadata.

## Typography
Inter is the foundational typeface, selected for its exceptional legibility in data-heavy environments. The system leverages variable font weights to create hierarchy without relying on color.

- **Data Legibility**: Use `body-md` for standard table content.
- **Emphasis**: Use `semibold` (600) for headlines and `medium` (500) for labels and buttons.
- **Tracking**: Use slightly tighter tracking for larger displays to maintain a contemporary, "tight" feel, and slightly increased tracking for small labels to ensure readability.

## Layout & Spacing
The layout follows a 12-column fluid grid for the main content area, with a fixed-width sidebar (240px or 280px). 

- **Density**: A tight 4px base unit is used for component-level spacing, while 16px and 24px increments define the relationship between layout blocks.
- **Padding**: Cards and containers should default to 24px (lg) padding on desktop and scale down to 16px (md) on mobile devices.
- **Breakpoints**: 
  - Mobile: < 640px (1 column)
  - Tablet: 640px - 1024px (Fixed margins, fluid columns)
  - Desktop: > 1024px (12 columns, max-width 1440px)

## Elevation & Depth
Depth is created through a combination of subtle borders and "Shadow-Looming"—diffused, low-opacity shadows that make elements appear integrated rather than floating.

- **Level 0 (Base)**: Soft Gray (#F8FAFC) background.
- **Level 1 (Cards)**: Pure White background, 1px border (#E2E8F0), and a very soft 4px blur shadow with 2% opacity.
- **Level 2 (Popovers/Modals)**: Pure White background, 1px border (#E2E8F0), and a 12px blur shadow with 5% opacity.
- **Interaction**: On hover, Level 1 cards can transition to Level 2 to provide tactile feedback without color shifts.

## Shapes
The design system employs a "Rounded Professional" geometry. 

- **Primary Radius**: 8px (0.5rem) for buttons, inputs, and small containers.
- **Large Radius**: 16px (1rem) for primary content cards and modals.
- **Strictness**: Avoid circular "pill" shapes for standard buttons to maintain a more architectural, enterprise feel; reserve pills exclusively for status tags (Chips).

## Components

### Buttons
- **Primary**: Solid Indigo (#4F46E5) with white text. 8px radius.
- **Secondary**: White background, 1px border (#E2E8F0), Text Primary (#0F172A).
- **Ghost**: No background/border, Indigo text. Used for low-priority actions.

### Cards
- **Structure**: Always white background, 16px border radius, and a 1px border (#E2E8F0).
- **Header**: Includes a subtle bottom border (#F1F5F9) separating title from body content.

### Input Fields
- **Default State**: 1px border (#E2E8F0), 8px radius.
- **Focus State**: 1px Indigo border with a 2px Indigo ring at 10% opacity.
- **Labels**: Always placed above the field in `label-sm` (Text Secondary).

### Lists & Tables
- **Row Styling**: High information density with 12px vertical padding.
- **Dividers**: 1px horizontal lines using #F1F5F9.
- **Hover**: Subtle background shift to #F8FAFC on row hover.

### Chips/Badges
- **Success**: Light Emerald background (10% opacity) with Emerald text.
- **Error**: Light Rose background (10% opacity) with Rose text.
- **Radius**: Fully rounded (Pill) to distinguish from interactive buttons.

### Data Tables
- Header should be `label-sm` in all-caps or medium weight, using Secondary Text (#475569) to recede visually and let data stand out.