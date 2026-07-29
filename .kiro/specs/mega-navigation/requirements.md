# Requirements: Mega Navigation System (Revised)

## Introduction

A hierarchical, CMS-driven mega navigation for IndianExamInfo that auto-populates from the database, supports unlimited pillars, lazy-loads exam lists on interaction, and provides a premium UX on desktop (two-panel hover) and mobile (nested accordion). The architecture scales to 50,000+ exams without performance degradation and requires zero code changes when new pillars, categories, or exams are added.

## Glossary

- **MegaNav**: The complete navigation system including desktop and mobile variants
- **CategoryPanel**: Left panel showing category names for the active pillar
- **ExamPanel**: Right panel showing exams for the hovered/tapped category
- **NavigationConfig**: The `navigation_config` table — a thin overlay on `categories` that controls display order, badges, visibility, and featured exams for navigation purposes only
- **Pillar**: A top-level content section (depth-0 category). Not hardcoded — unlimited pillars supported.
- **SafeZone**: The diagonal movement triangle algorithm preventing accidental menu closure when moving from category to exam panel
- **HoverIntent**: A 80-100ms delay before triggering hover actions to prevent accidental activation

## Requirements

### Requirement 1: Two-Panel Desktop Mega Menu

**User Story:** As a desktop visitor, I want to hover a pillar item and immediately see categories on the left and exams on the right, so I can reach any exam in 2 interactions.

#### Acceptance Criteria
1. WHEN a visitor hovers a pillar trigger for ≥80ms (HoverIntent), THE MegaNav SHALL open a two-panel dropdown: CategoryPanel (left, 220px) + ExamPanel (right, remaining width up to 680px).
2. THE MegaNav SHALL display the first category's exams by default when the menu opens.
3. WHEN a visitor moves the mouse to a different category, THE ExamPanel SHALL update within 0ms (instant switch) for cached data or show a skeleton for ≤200ms for uncached data.
4. THE MegaNav SHALL implement SafeZone triangle geometry so that diagonal mouse movement from CategoryPanel toward ExamPanel does NOT close the menu or switch categories accidentally.
5. WHEN the mouse leaves the MegaNav boundary AND is not within the SafeZone, THE menu SHALL close after a 150ms delay.
6. THE MegaNav total width SHALL NOT exceed 900px and SHALL be positioned left-aligned to the trigger, never overflowing the viewport right edge.
7. THE MegaNav height SHALL NOT exceed 70vh and SHALL be scrollable if content exceeds this.

### Requirement 2: Mobile Nested Accordion

**User Story:** As a mobile visitor, I want to tap to expand pillars and categories so I can navigate without hover interactions.

#### Acceptance Criteria
1. BELOW 1024px viewport width, THE MegaNav SHALL render a MobileAccordion instead of the hover-based dropdown.
2. Tapping a pillar SHALL expand its category list; tapping again SHALL collapse it.
3. Tapping a category SHALL expand its exam list (lazy-fetched); tapping again SHALL collapse it.
4. Only ONE pillar section SHALL be expanded at a time (auto-collapse others).
5. All touch targets SHALL be ≥44x44px per WCAG 2.2 AA.
6. THE MobileAccordion SHALL support swipe-left gesture to close the entire menu.
7. A sticky back-button/header SHALL show the current pillar name when the user is ≥2 levels deep.

### Requirement 3: Auto-Population from Database

**User Story:** As a content manager, I want new exams to automatically appear in the navigation without manual menu editing.

#### Acceptance Criteria
1. THE CategoryPanel SHALL populate from the `categories` table filtered by pillar, `is_active = true`, `parent_id IS NULL`, ordered by `navigation_config.display_order` (falling back to `categories.order_index`).
2. THE ExamPanel SHALL populate from the `exams` table filtered by `category_id`, `is_published = true`, ordered by featured first then alphabetically, limited to `navigation_config.max_items` (default 15).
3. Featured exams (from `navigation_config.featured_exam_ids`) SHALL appear pinned at the top of the ExamPanel.
4. WHEN a new exam is published in the CMS, it SHALL appear in the navigation within the cache revalidation window (≤60 minutes) or immediately if manual revalidation is triggered.
5. WHEN a category has zero published exams AND `auto_hide_empty` is enabled in global settings, that category SHALL be hidden from the CategoryPanel.

### Requirement 4: Lazy Loading Strategy

**User Story:** As a visitor, I want the navigation to load instantly without blocking page render.

#### Acceptance Criteria
1. Category lists SHALL be server-rendered (included in HTML) — zero client JS needed to display the CategoryPanel.
2. Exam lists SHALL be client-fetched on first hover/tap per category, then cached in-memory for the browser session.
3. The top 3 most popular categories per pillar SHALL be prefetched via `requestIdleCallback` after page load.
4. WHILE exam data is loading, a skeleton (3 shimmer rows) SHALL display in the ExamPanel.
5. Total navigation API response time SHALL be <50ms (indexed query, max 15 rows).

### Requirement 5: In-Menu Search

**User Story:** As a visitor looking for a specific exam, I want to search within the mega menu to find it without browsing categories.

#### Acceptance Criteria
1. A search input SHALL appear at the top of the ExamPanel (desktop) and at the top of the MobileAccordion.
2. After 2+ characters and a 300ms debounce, THE MegaNav SHALL filter exams across ALL categories within the active pillar by `name` and `short_name` (case-insensitive).
3. Search results SHALL show exam name + category badge, linking directly to the exam page.
4. Clearing the search SHALL return to the category-based view.
5. WHEN no results match, a "No results found" message with a link to the full search page SHALL display.

### Requirement 6: Category Badges and Metadata

**User Story:** As a visitor, I want visual indicators showing exam count and category freshness so I can identify popular or recently updated sections.

#### Acceptance Criteria
1. Each category in the CategoryPanel SHALL display its exam count (number of published exams).
2. Each category MAY display ONE badge label: "Popular", "New", "Updated", or none — configured via NavigationConfig.
3. Badge styling: "Popular" = amber, "New" = green, "Updated" = blue.
4. THE exam count SHALL be calculated from the live `exams` table count (cached, refreshed hourly).

### Requirement 7: View All Link

#### Acceptance Criteria
1. A "View All {Category} →" link SHALL appear at the bottom of the ExamPanel.
2. Clicking it SHALL navigate to `/{pillar}/{category-slug}`.
3. On mobile, the "View All" link SHALL appear at the bottom of each expanded category.

### Requirement 8: Keyboard Accessibility (WCAG 2.2 AA)

#### Acceptance Criteria
1. Enter/Space on a pillar trigger SHALL open the mega menu and focus the first category.
2. Arrow Down/Up SHALL move between categories in the CategoryPanel.
3. Arrow Right SHALL move focus into the ExamPanel; Arrow Left SHALL return to CategoryPanel.
4. Tab SHALL cycle through exam links within the ExamPanel.
5. Escape SHALL close the menu and return focus to the trigger.
6. `aria-expanded`, `aria-haspopup="true"`, `aria-controls`, `role="menu"`, `role="menuitem"` SHALL be correctly applied.
7. `aria-live="polite"` region SHALL announce when ExamPanel content changes.

### Requirement 9: Animations

#### Acceptance Criteria
1. Menu open: fade-in + translateY(-4px → 0) over 200ms ease-out.
2. Menu close: fade-out over 150ms ease-in.
3. ExamPanel content switch: crossfade over 150ms.
4. WHEN `prefers-reduced-motion: reduce` is active, ALL animations SHALL be disabled (instant show/hide).
5. Animations SHALL use `transform` and `opacity` only (GPU-accelerated, no layout triggers).

### Requirement 10: Multi-Pillar Support

#### Acceptance Criteria
1. THE MegaNav SHALL support unlimited pillars (not hardcoded to 3).
2. Pillar-specific accent colors SHALL be configurable via NavigationConfig or inferred from category metadata.
3. Each pillar's mega menu operates independently (hovering a different pillar switches context entirely).

### Requirement 11: CMS Navigation Module

**User Story:** As a content manager, I want a dedicated CMS panel to control navigation appearance without developer help.

#### Acceptance Criteria
1. A "Navigation" section in the CMS SHALL show all categories grouped by pillar.
2. Drag-and-drop SHALL reorder categories within each pillar's navigation.
3. Per-category controls: visibility toggle, badge selector, custom label, custom icon, max items slider, featured exams multi-select.
4. A live preview panel SHALL show how the mega menu will look with current settings.
5. "Save & Publish" SHALL persist to `navigation_config` and trigger frontend cache revalidation.

### Requirement 12: Performance and Stability

#### Acceptance Criteria
1. Navigation bar SHALL have a fixed reserved height (56px) to prevent CLS.
2. Category data SHALL use ISR with 60-minute revalidation.
3. Exam data API calls SHALL have a composite index on `(category_id, is_published, is_featured, name)`.
4. IF the API fails, THE MegaNav SHALL display last-known-good cached data without visible error.
5. The MegaNav component SHALL be dynamically imported (`next/dynamic`) — not in the initial JS bundle for pages where it's not interacted with.
6. Total interaction latency (hover → content visible) SHALL be <100ms for cached categories.

### Requirement 13: SEO Strategy

#### Acceptance Criteria
1. Category links (CategoryPanel) SHALL be server-rendered as `<a>` tags (provides internal linking equity from every page).
2. Exam links (ExamPanel) SHALL be client-rendered on interaction (avoids 200+ links diluting PageRank per page).
3. THE navigation SHALL be wrapped in a `<nav aria-label="Main navigation">` element.
4. Individual exam discoverability SHALL come from category listing pages + XML sitemap — NOT from mega menu HTML.

### Requirement 14: Analytics

#### Acceptance Criteria
1. THE MegaNav SHALL track: menu_open, category_hover, exam_click, search_query, view_all_click, menu_close events.
2. Events SHALL include: pillar, category slug, exam slug (if applicable), source (desktop/mobile), timestamp.
3. Events SHALL be sent to Google Analytics 4 via `gtag()` custom events.
4. THE CMS Navigation module SHALL display click counts per category (updated daily).
