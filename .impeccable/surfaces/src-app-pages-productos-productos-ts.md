---
version: 1
slug: "src-app-pages-productos-productos-ts"
primary_target: "src/app/pages/productos/productos.ts"
related_targets:
  - "src/app/app.routes.ts"
  - "src/app/shared/components/sidebar/sidebar.html"
---

# Productos — surface brief

**Scope:** new route inside the existing `reporteador-pecuarios` dashboard, `/productos`. Extends the incumbent world; changes no token, no shared component, and no existing route's behavior.
**Visitor mode:** Operate. The analyst arrives with a period and a question: which product earned the traffic.

## Audience, job, action

- **Audience:** media analysts at Pecuarios reviewing product performance daily, alongside `/dashboard` and `/campanias`.
- **Job:** judge a period's product traffic — volume, the single product carrying it, who the visitor is, and the ranking underneath.
- **Task:** set a period, apply, read the total and its shape, scan the profile, walk the ranking, filter by name, reorder, toggle actives.
- **Content:** total de visualizaciones, productos publicados, producto más visitado, serie temporal, ocupación/edad/país, ranking de productos con imagen y visitas.
- **Constraints:** no tables at any breakpoint; no new global tokens; reuse `app-date-range`, `app-search`, the `.title-section__*` header, the dashboard's `.kpi-card` band, the `.chart-tabs` segmented control, the `.profile-bar` grammar, the dashed `.activity-empty` empty card, the tinted pill badges, and the `spin` keyframe in `login.component.css`.

## Data

`VisitasService.seccion(division, empresa, 'productos', fi, ff)` → `ResponseSecciones`. No new interfaces, no mock: `visitas` (total, prom_dia, serie), `contenidos` (total, data[], popular[]), `perfilVisita` (ocupaciones, paises, visitasXgenero). `elemento.estatus === 1` is the documented "activo" rule, so the actives switch defaults on. Sort offers only what real fields support: visitas desc, visitas asc, nombre A–Z.

## Chosen direction

The ranking is the page, and it starts above the fold: the period's visit total plus its own wide inline area chart occupy the first card, and every product row below repeats the same comparison at a glance.

**Memorable moment:** the count column. Tabular figures, right-aligned, one per row, so a wall of products reads as a column of numbers before it reads as a column of names — the analyst compares magnitudes the way they would compare columns in a ledger, without reading a single name.

## Unresolved decisions

- No pagination: `contenidos.data` arrives whole for the period; a real endpoint may need paging.
- The badge for non-active products appears only when the actives switch is off, since with the switch on (the default) the rule is already applied by the filter.
- Breadcrumb still says "Resumen" for every route (inherited from `layout.component.ts`); not changed here.

## Direction contract

**THESIS.** A product-analytics page read as a ranking instrument, not a catalog. The category default for "product cards" is a 3-up image-top grid; this refuses it — the page opens with the period's visit total and its shape as the only graphic on the page, and everything below repeats one comparison: rank, name, count.

**OWN-WORLD.** Pecuarios' incumbent world, unchanged: `--color-sitio #0F261D` green as the only accent over `oklch(0.975 0.003 256)`, white `--color-surface` cards, `1px` `--color-border`, `--radius-md` 8px, `--shadow-sm`→`--shadow-md`, Inter 13–15px, 600 for anything that names something, tabular figures on every count, the dashboard's `.kpi-card` padding and the `border-left` that marks only the featured one, the `.chart-tabs` segmented control, `.search`, tinted `oklch(0.92 0.04 h)` tiles, dashed empty cards. Nothing new is introduced.

**STORY.** The analyst sets a period, reads one number and the shape of its curve, finds out who the visitor is, then walks the ranking down until a name is recognised. Rank leads, the count settles the comparison, the 64px photo only confirms.

**FIRST VIEWPORT.** At 1440×900: `Productos` at 1.5rem/700/-0.02em with its sub-line at 0.875rem `--color-ink-secondary`, left; `app-date-range` at the right edge of the same row. Below, a three-card band: the featured card takes the widest column and carries the 2rem tabular total, the word "visualizaciones", an 88px area chart spanning the card's width with a date axis and a crosshair, and a `prom_dia` + peak-day footer; `Productos publicados` and `Producto más visitado` each take one column, the latter with a 56px photo, the product name at 0.9375rem/600 and its count. Total and trend are both above the fold.

**FORM.** Ranked compact rows in two columns, position 2 of 5 (thumbnail-top grid, ranked compact rows, single-column full-width rows, variable-pie trio, split screen). Code-led, no concept round: the request named its components and bans, and the three confirmed answers — wide area in the KPI, three sort criteria, two-column ranked rows — fixed the remaining structure.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
