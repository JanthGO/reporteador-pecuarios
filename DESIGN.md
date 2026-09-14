# Design System

## Color Palette

**Strategy**: Restrained — tinted neutrals + one accent ≤10%

### Primary

```css
--color-primary: oklch(0.45 0.18 256);     /* deep navy-indigo */
--color-primary-light: oklch(0.55 0.16 256); /* medium indigo */
--color-primary-lighter: oklch(0.92 0.03 256); /* tinted wash */
```

### Accent

```css
--color-accent: oklch(0.65 0.16 155);       /* teal — distinct from indigo */
--color-accent-light: oklch(0.88 0.05 155);
```

### Surface

```css
--color-bg: oklch(1.000 0.000 0);           /* pure white */
--color-surface: oklch(0.975 0.003 256);    /* near-white, cool tint toward indigo */
--color-surface-raised: oklch(1.000 0.000 0);
```

### Ink

```css
--color-ink: oklch(0.18 0.01 256);          /* near-black, cool undertone */
--color-ink-secondary: oklch(0.45 0.01 256); /* muted body text */
--color-ink-muted: oklch(0.62 0.008 256);   /* captions, placeholders */
```

### Status

```css
--color-success: oklch(0.62 0.17 155);
--color-warning: oklch(0.78 0.15 75);
--color-danger: oklch(0.58 0.22 25);
--color-info: oklch(0.55 0.16 256);
```

### Borders

```css
--color-border: oklch(0.92 0.005 256);
--color-border-strong: oklch(0.85 0.01 256);
```

## Typography

**Font stack**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Headings**: Inter Tight (if available) or Inter, weights 500–700.

| Role | Size | Weight | Line-height | Letter-spacing |
|------|------|--------|-------------|----------------|
| Display | `clamp(1.75rem, 3vw, 2.5rem)` | 700 | 1.15 | -0.02em |
| H1 | `clamp(1.5rem, 2.5vw, 2rem)` | 600 | 1.2 | -0.015em |
| H2 | `clamp(1.25rem, 2vw, 1.5rem)` | 600 | 1.25 | -0.01em |
| H3 | `1.125rem` | 600 | 1.3 | 0 |
| Body | `0.9375rem` (15px) | 400 | 1.6 | 0 |
| Small | `0.8125rem` | 400 | 1.5 | 0 |
| Mono | `0.8125rem` | 500 | 1.5 | 0.01em |

**Line cap**: 65–75ch for body text. `text-wrap: balance` on headings, `text-wrap: pretty` on long prose.

## Spacing Scale

| Token | Value |
|-------|-------|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.25rem` (20px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-10` | `2.5rem` (40px) |
| `--space-12` | `3rem` (48px) |
| `--space-16` | `4rem` (64px) |

## Border Radius

```css
--radius-sm: 0.375rem;  /* 6px — buttons, inputs */
--radius-md: 0.5rem;    /* 8px — cards, panels */
--radius-lg: 0.75rem;   /* 12px — modals */
--radius-full: 9999px;  /* pills, avatars */
```

## Shadows

```css
--shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
--shadow-md: 0 2px 8px oklch(0 0 0 / 0.08);
--shadow-lg: 0 4px 16px oklch(0 0 0 / 0.10);
--shadow-focus: 0 0 0 3px oklch(0.45 0.18 256 / 0.25);
```

## Layout

- **Sidebar**: 260px expanded, 64px collapsed. Fixed left.
- **Header**: 56px height, fixed top.
- **Content**: fluid, `max-width: 1400px`, centered.
- **Cards**: `padding: var(--space-6)`, `border-radius: var(--radius-md)`.
- **Grid**: `repeat(auto-fit, minmax(280px, 1fr))` for responsive card grids.

## Components

### Data Table

- Header row: `font-weight: 600`, `font-size: 0.8125rem`, uppercase, `letter-spacing: 0.04em`, `color: var(--color-ink-secondary)`.
- Body rows: `border-bottom: 1px solid var(--color-border)`.
- Hover: `background: var(--color-surface)`.
- Zebra striping: none. Clean rows, hover only.

### Card

- Background: `var(--color-surface-raised)`.
- Border: `1px solid var(--color-border)`.
- Border radius: `var(--radius-md)`.
- Shadow: `var(--shadow-sm)`.
- Padding: `var(--space-6)`.

### Button (Primary)

- Background: `var(--color-primary)`.
- Text: white (`oklch(1 0 0)`).
- Padding: `0.625rem 1.25rem`.
- Border radius: `var(--radius-sm)`.
- Font: `0.875rem`, weight 600.
- Hover: `var(--color-primary-light)`.

### Button (Secondary)

- Background: transparent.
- Border: `1px solid var(--color-border-strong)`.
- Text: `var(--color-ink)`.

### Input

- Height: `2.5rem`.
- Border: `1px solid var(--color-border)`.
- Border radius: `var(--radius-sm)`.
- Padding: `0 var(--space-3)`.
- Focus: `border-color: var(--color-primary)`, `box-shadow: var(--shadow-focus)`.

### Chart Card

- Container: card with `padding: var(--space-6)`.
- Title: `font-size: 0.9375rem`, weight 600, `margin-bottom: var(--space-4)`.
- Chart area: `min-height: 300px`.
- Legend: horizontal, below chart, `font-size: 0.8125rem`.

## Motion

```css
--duration-fast: 120ms;
--duration-normal: 200ms;
--duration-slow: 350ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

All transitions use `var(--ease-out)`. No bounce. Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-toast: 500;
--z-tooltip: 600;
```

## Dark Mode (future)

Dark palette is not implemented yet but the token structure supports it. When ready:

- `--color-bg`: `oklch(0.14 0.01 256)`
- `--color-surface`: `oklch(0.18 0.01 256)`
- `--color-surface-raised`: `oklch(0.22 0.01 256)`
- `--color-ink`: `oklch(0.93 0.005 256)`
- Primary/accent stay the same.
