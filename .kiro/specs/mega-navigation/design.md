# Technical Design: Mega Navigation System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                           │
│                                                              │
│  HeaderWithMenu (Server Component)                           │
│  ├── Fetches categories + navigation_config (ISR 60min)     │
│  └── Passes to client Header                                │
│                                                              │
│  Header (Client Component)                                   │
│  ├── MegaMenuDesktop (lazy-loaded)                          │
│  │   ├── NavigationTrigger (hover intent)                   │
│  │   ├── MegaMenuPanel                                      │
│  │   │   ├── CategoryPanel (server-rendered links)          │
│  │   │   ├── ExamPanel (client-fetched on hover)            │
│  │   │   └── NavigationSearch                               │
│  │   └── SafeZoneTriangle                                   │
│  └── MegaMenuMobile (accordion)                             │
│      ├── PillarAccordion                                    │
│      └── CategoryAccordion → ExamList (lazy)                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Supabase (Postgres)                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  categories  │  │  exams   │  │  navigation_config   │  │
│  └──────────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### navigation_config Table (NEW)

```sql
CREATE TABLE navigation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  badge TEXT CHECK (badge IN ('popular', 'new', 'updated', NULL)),
  custom_label TEXT,
  custom_icon TEXT,
  featured_exam_ids UUID[] DEFAULT '{}',
  max_items INTEGER NOT NULL DEFAULT 15,
  show_exam_count BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nav_config_category ON navigation_config(category_id);

-- RLS: public read (for frontend), staff write
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_nav_config" ON navigation_config FOR SELECT USING (true);
CREATE POLICY "staff_write_nav_config" ON navigation_config FOR ALL USING (auth.uid() IS NOT NULL);

-- Performance index on exams for nav queries
CREATE INDEX IF NOT EXISTS idx_exams_nav_query
  ON exams(category_id, is_published, is_featured, name)
  WHERE is_published = true;
```

### API Endpoints (Supabase PostgREST)

**1. Get categories for navigation (server-side, cached 60min):**
```sql
SELECT c.id, c.slug, c.name, c.icon, c.pillar,
       nc.display_order, nc.is_visible, nc.badge, nc.custom_label,
       nc.custom_icon, nc.max_items, nc.show_exam_count, nc.featured_exam_ids,
       (SELECT COUNT(*) FROM exams e WHERE e.category_id = c.id AND e.is_published = true) as exam_count
FROM categories c
LEFT JOIN navigation_config nc ON nc.category_id = c.id
WHERE c.is_active = true AND c.parent_id IS NULL
  AND (nc.is_visible IS NULL OR nc.is_visible = true)
ORDER BY COALESCE(nc.display_order, c.order_index)
```

**2. Get exams for a category (client-side, on hover/tap):**
```sql
SELECT id, slug, short_name, name, is_featured, status
FROM exams
WHERE category_id = $1 AND is_published = true
ORDER BY is_featured DESC, name ASC
LIMIT $2  -- from navigation_config.max_items
```

## Component Architecture

### Frontend Components

```
src/components/navigation/
├── NavigationProvider.tsx    — Context: active pillar, category, cache
├── MegaMenuDesktop.tsx      — Two-panel hover menu
├── MegaMenuMobile.tsx       — Nested accordion
├── CategoryPanel.tsx        — Left panel with category list
├── ExamPanel.tsx            — Right panel with exam links
├── NavigationSearch.tsx     — In-menu search with debounce
├── CategoryItem.tsx         — Single category row with badge
├── ExamItem.tsx             — Single exam link
├── ViewAllLink.tsx          — "View All Engineering Exams →"
├── SafeZoneTriangle.tsx     — Diagonal movement handler
├── NavigationSkeleton.tsx   — Loading state
└── hooks/
    ├── useHoverIntent.ts    — 80ms delay hover
    ├── useSafeZone.ts       — Triangle geometry
    ├── useNavCache.ts       — In-memory exam list cache
    └── useNavAnalytics.ts   — GA4 event dispatch
```

### CMS Components

```
src/components/navigation-settings/  (CMS repo)
├── NavigationSettingsPage.tsx   — Main admin page
├── PillarSection.tsx            — Per-pillar category list
├── CategoryConfigRow.tsx        — Drag-and-drop row with controls
├── FeaturedExamPicker.tsx       — Multi-select for featured exams
└── NavigationPreview.tsx        — Live mega menu preview
```

## Data Flow

```
Page Load (Server):
  HeaderWithMenu → fetch categories + nav_config → pass as props → Header renders

User Hovers Pillar (Client):
  Header → setActivePillar → MegaMenuDesktop opens
  → CategoryPanel shows categories (already in props)
  → First category auto-selected → ExamPanel fetches exams (or cache hit)

User Hovers Category (Client):
  CategoryPanel → setActiveCategory → ExamPanel re-fetches (or cache hit)
  → SafeZone prevents accidental close during diagonal movement

User Clicks Exam:
  ExamPanel → Link navigates → menu closes → analytics event fired
```

## Performance Strategy

| Stage | Data | Source | Latency |
|-------|------|--------|---------|
| SSR | Categories + nav_config | ISR cache (60min) | 0ms (in HTML) |
| Idle prefetch | Top 3 categories' exams | Client fetch | Background |
| On hover | Remaining categories' exams | Client fetch → session cache | <200ms first, 0ms after |
| Search | Cross-category filter | Client API call with debounce | <100ms |

## Hover Behavior (Desktop)

```
HOVER TRIGGER (80ms intent delay)
    │
    ▼
MENU OPENS (200ms fade-in animation)
    │
    ▼
CATEGORY HOVER (0ms switch for cached, skeleton for uncached)
    │
    ├── Mouse moves toward ExamPanel
    │   └── SafeZone ACTIVE → don't change category
    │
    ├── Mouse moves to new category
    │   └── Switch ExamPanel content
    │
    └── Mouse leaves menu boundary
        └── 150ms close delay → CLOSE (150ms fade-out)
```

## Mobile Behavior

```
TAP HAMBURGER → Open overlay (full height, slide from right)
    │
    ▼
PILLAR LIST (all pillars visible, collapsed)
    │ TAP pillar
    ▼
CATEGORY LIST (expands under pillar, lazy-loaded)
    │ TAP category
    ▼
EXAM LIST (expands under category, lazy-fetched)
    │ TAP exam
    ▼
NAVIGATE → Close menu
```

## SEO Rendering Strategy

- **Server HTML contains:** `<nav>` → pillar links → category links (as `<a>` tags)
- **Server HTML does NOT contain:** individual exam links (loaded client-side on interaction)
- **Reason:** Prevents 200+ links per page diluting PageRank; categories provide the structural linking value
- **Exam discoverability:** Via category listing pages (`/entrance-exam/engineering` shows all engineering exams) + XML sitemap

## Implementation Phases

1. **Phase 1:** Database (`navigation_config` table + index) + API service
2. **Phase 2:** Frontend components (CategoryPanel, ExamPanel, MegaMenuDesktop)
3. **Phase 3:** Mobile accordion + search
4. **Phase 4:** Hooks (hover intent, safe zone, cache, analytics)
5. **Phase 5:** CMS Navigation Settings page
6. **Phase 6:** Performance optimization (prefetch, dynamic import)
7. **Phase 7:** Accessibility audit + ARIA
8. **Phase 8:** Analytics integration
