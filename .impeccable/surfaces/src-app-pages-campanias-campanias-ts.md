---
version: 1
slug: "src-app-pages-campanias-campanias-ts"
primary_target: "src/app/pages/campanias/campanias.ts"
related_targets: []
---

# Campaña — surface brief

**Scope:** new route inside the existing `reporteador-pecuarios` dashboard, `/campanias`. Does not change the visual world, the router shell, or any shared token.
**Visitor mode:** Operate. The analyst arrives with a task, not a mood.

## Audience, job, action

- **Audience:** media analysts at Pecuarios reviewing campaign publishing activity daily, alongside the existing dashboard sections.
- **Job:** see which campaigns an empresa published inside a chosen period, and jump straight to the campaign itself.
- **Task:** set a date range, apply, scan, find by name, open in a new tab.
- **Content:** publication date, image, campaign name, campaign link.
- **Constraints:** no tables at any breakpoint; compact and scannable; no new global tokens; reuse `app-date-range`, the `.title-section__*` header pattern, the card grammar of `recent-activity`/`performance-card`, the `.activity-empty` empty state, and the `spin` keyframe already in `login.component.css`.

## Chosen direction

Compact horizontal campaign cards in a two-column grid — a 16:9 thumbnail at the left, the publication date as the highest-hierarchy text, the name beneath it, and a quiet external-link affordance at the right. The list inherits the "Actividad reciente" grammar one step further: that section pairs a 40px icon tile with a title and a meta line; a campaign needs a wider tile, so the 40px square becomes a 96×54 thumbnail and the title moves below the date, because the brief pins date above name.

**Memorable moment:** the date reading as a dateline — set in the site's green, tabular, tight — sitting above a muted name, so a wall of cards scans as a column of dates before it reads as a column of names.

**Data:** demo data held in a component signal (confirmed with the user); no HTTP service yet. The signal is the single seam to swap for a real `CampaignsService` later.

## Unresolved decisions

- Real campaigns endpoint and response shape are unknown; the demo signal stands in.
- No pagination: the demo set is small and the period filter bounds it. A real endpoint may need paging.
- Breadcrumb still says "Resumen" for every route (inherited from `layout.component.ts`); not changed here.

## Direction contract

**THESIS.** A campaign library read as a dateline index, not a card gallery. The category default for "campaign cards" is a 3-up image-top grid; this refuses that and makes the publication date the largest, darkest element on every card, with the image demoted to a recognition aid you glance at second.

**OWN-WORLD.** Pecuarios' existing world, unchanged: `--color-sitio: #0F261D` green on an `oklch(0.975 0.003 256)` page, white `--color-surface` cards, `1px` `--color-border` (oklch 0.92 0.005 256), `--radius-md` 8px, `--shadow-sm` to `--shadow-md`, Inter at 13–15px, 600 weight for anything that names something. Tinted icon tiles at `oklch(0.92 0.04 h)` and pills at `--radius-full` are already the dashboard's vocabulary; nothing new is introduced.

**STORY.** The analyst sets a period, sees a count, and reads a column of dates. A campaign they recognise by its thumbnail gets opened; one they don't gets read by name. The link is the last thing they touch, and it is always external.

**FIRST VIEWPORT.** At 1440×900: `Campaña` H1 (1.5rem/700/-0.02em) with "Consulta las campañas publicadas durante un periodo determinado." at 0.875rem `--color-ink-secondary`, left; `app-date-range` at its right edge, sharing the row with the search field. Below, a results line ("N campañas" with the applied period) and the card grid starting in the first screen. The grid is the page's floor, not a section below the fold.

**FORM.** Compact horizontal cards, 2 columns, chosen from a list of five derived structures (thumbnail-top grid, timeline-by-month, full-bleed list, KPI strip + grid, compact horizontal cards) — position 1 of 5. No concept-seed script: the brief specifies the components and the visual system is fixed, so this is a narrow extension, not an open surface.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
