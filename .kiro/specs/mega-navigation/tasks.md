# Implementation Plan: Mega Navigation System

## Overview

Replace the existing column-based CmsMegaMenu with a two-panel hover mega menu (desktop) and nested accordion (mobile). Auto-populates exams from the database via a `navigation_config` overlay table. Implements hover intent, safe-zone diagonal movement, lazy loading, in-menu search, and CMS administration.

## Tasks

- [ ] 1. Create navigation_config database table and performance index
  - Apply Supabase migration: create `navigation_config` table with category_id FK, display_order, is_visible, badge, custom_label, custom_icon, featured_exam_ids, max_items, show_exam_count
  - Add RLS: public read, staff write
  - Create composite index on `exams(category_id, is_published, is_featured, name) WHERE is_published = true`
  - Seed default navigation_config rows for all existing active categories
  - Requirements: R3, R12

- [ ] 2. Create navigation data service (frontend)
  - Create `src/services/navigationService.ts` in the frontend
  - Implement `getNavigationCategories(pillar)` — fetches categories + nav_config joined, cached 60min via ISR
  - Implement `getExamsForCategory(categoryId, limit)` — client-side fetch for exam panel
  - Implement `searchExamsInPillar(pillar, query)` — search across categories
  - All queries use the existing Supabase anon client
  - Requirements: R3, R4, R5

- [ ] 3. Create NavigationProvider context and hooks
  - Create `src/components/navigation/NavigationProvider.tsx` — context holding active pillar, active category, exam cache
  - Create `useHoverIntent(delay = 80)` hook — returns handlers that trigger only after delay
  - Create `useSafeZone()` hook — tracks mouse position, returns whether cursor is in safe triangle
  - Create `useNavCache()` hook — in-memory Map of categoryId → exams[], invalidated on navigation
  - Requirements: R1, R4

- [ ] 4. Build CategoryPanel component
  - Create `src/components/navigation/CategoryPanel.tsx`
  - Renders category list with: name (or custom_label), icon, exam count badge, label badge (Popular/New/Updated)
  - Highlights active category with accent color
  - Supports keyboard Arrow Up/Down navigation
  - Server-renders category links as `<a>` tags for SEO
  - Requirements: R1, R6, R8, R13

- [ ] 5. Build ExamPanel component
  - Create `src/components/navigation/ExamPanel.tsx`
  - Displays exam list for active category (fetched via useNavCache)
  - Shows skeleton while loading
  - Pins featured exams at top
  - Shows "View All {Category} →" link at bottom
  - Supports keyboard Tab navigation through exam links
  - 150ms crossfade animation on content switch
  - Requirements: R1, R4, R7, R9

- [ ] 6. Build MegaMenuDesktop component
  - Create `src/components/navigation/MegaMenuDesktop.tsx`
  - Two-panel layout: CategoryPanel (220px) + ExamPanel (remaining)
  - Positioned left-aligned to trigger, max 900px wide, max 70vh tall
  - Opens on hover intent (80ms), closes on mouse-leave (150ms delay)
  - Implements SafeZone triangle between CategoryPanel and ExamPanel
  - Portal-rendered to avoid z-index stacking issues
  - Requirements: R1, R9, R12

- [ ] 7. Build MegaMenuMobile component
  - Create `src/components/navigation/MegaMenuMobile.tsx`
  - Full-height overlay sliding from right
  - Nested accordion: Pillar → Categories → Exams
  - Only one pillar expanded at a time
  - Touch targets ≥ 44px
  - Swipe-left to close
  - "View All" at bottom of each category
  - Search input at the top
  - Requirements: R2, R5, R7

- [ ] 8. Build NavigationSearch component
  - Create `src/components/navigation/NavigationSearch.tsx`
  - Input with 300ms debounce, minimum 2 chars
  - Calls `searchExamsInPillar` and displays results grouped by category
  - Shows "No results" + link to full search page when empty
  - Clearing returns to category view
  - Requirements: R5

- [ ] 9. Integrate into Header component
  - Update `src/components/layout/Header.tsx` to use new MegaMenuDesktop/MegaMenuMobile
  - Update `src/components/layout/HeaderWithMenu.tsx` to fetch navigation categories via new service
  - Replace CmsMegaMenu usage with new components
  - Keep QuickAccessBar unchanged
  - Dynamically import MegaMenuDesktop (code-split, not in initial bundle)
  - Requirements: R10, R12

- [ ] 10. Implement idle prefetching
  - After page load, use `requestIdleCallback` to prefetch exam lists for top 3 categories per active pillar
  - Store in useNavCache so hover shows data instantly
  - Only prefetch if user hasn't interacted with menu within 3 seconds
  - Requirements: R4, R12

- [ ] 11. Add accessibility (ARIA + keyboard)
  - Add `role="navigation"`, `role="menubar"`, `role="menu"`, `role="menuitem"` to appropriate elements
  - Implement arrow key navigation (Up/Down for categories, Right/Left for panel switch)
  - Add `aria-expanded`, `aria-haspopup`, `aria-controls` on triggers
  - Add `aria-activedescendant` for category focus tracking
  - Add `aria-live="polite"` region for ExamPanel content changes
  - Add focus trap while menu is open
  - Test with `prefers-reduced-motion: reduce` (disable all animations)
  - Requirements: R8, R9

- [ ] 12. Add analytics tracking
  - Create `useNavAnalytics()` hook that dispatches GA4 events via `gtag()`
  - Track: menu_open, category_hover, exam_click, search_query, view_all_click, menu_close
  - Include: pillar, category, exam slug, source (desktop/mobile)
  - Requirements: R14

- [ ] 13. Build CMS Navigation Settings page
  - Create `src/pages/navigation/NavigationSettingsPage.tsx` in the CMS
  - Show categories grouped by pillar with drag-and-drop reordering
  - Per-category: visibility toggle, badge dropdown (Popular/New/Updated/None), custom label, featured exams multi-select, max items slider
  - Save persists to `navigation_config` table + triggers frontend revalidation
  - Create corresponding `src/services/navigationConfigService.ts` for CRUD
  - Requirements: R11

- [ ] 14. Performance optimization and testing
  - Verify: no CLS (fixed 56px header height)
  - Verify: <100ms hover-to-visible for cached categories
  - Verify: <200ms for first uncached category load
  - Verify: graceful degradation when API fails (show cached/empty, no error UI)
  - Verify: dynamic import of MegaMenuDesktop reduces initial bundle
  - Verify: server-renders category links in HTML (check view-source)
  - Requirements: R12, R13

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": [1]},
    {"tasks": [2]},
    {"tasks": [3, 4, 5]},
    {"tasks": [6, 7, 8]},
    {"tasks": [9, 10]},
    {"tasks": [11, 12]},
    {"tasks": [13]},
    {"tasks": [14]}
  ]
}
```

## Notes

- Wave 1-2 (data layer) must complete before UI work
- Wave 3 components are independent and can be built in parallel
- Wave 4 combines components into complete menus
- Wave 5 integrates into the existing header
- Wave 6-7 are enhancement layers (accessibility, analytics, CMS)
- Wave 8 is final verification
- The existing `CmsMegaMenu` component is kept as-is during development — switched over in Task 9
- The CMS navigation page (Task 13) can be developed in parallel with frontend tasks
- Total estimated effort: 10-12 development sessions
