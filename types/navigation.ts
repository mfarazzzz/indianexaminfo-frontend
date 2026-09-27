/**
 * navigation.ts — Shared types for the 6-domain navigation system.
 * Used by both the frontend mega menu and the CMS menu manager.
 */

// ═══════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════

/** All 6 navigation pillars (knowledge domains) */
export type NavigationPillar =
  | "government-exam"
  | "govt-vacancy"
  | "entrance-exam"
  | "university-exam"
  | "board-exam"
  | "news";

/** Badge types for navigation items */
export type BadgeType = "popular" | "new" | "updated" | "trending" | "urgent" | null;

/** Cross-domain discovery facets */
export type DiscoveryFacet =
  | "state"
  | "qualification"
  | "stream"
  | "degree"
  | "department"
  | "organisation"
  | "university"
  | "board"
  | "course"
  | "selection-process"
  | "admission-mode"
  | "exam-mode"
  | "frequency"
  | "status";

// ═══════════════════════════════════════════════════════════════════
// TAXONOMY NODE (core hierarchy unit)
// ═══════════════════════════════════════════════════════════════════

export interface TaxonomyNode {
  id: string;
  slug: string;
  label: string;
  pillar: NavigationPillar;
  parentId: string | null;
  path: string; // materialized: "government-exam/ssc/ssc-cgl"
  depth: number;
  displayOrder: number;
  isActive: boolean;
  isPinned: boolean;

  // Display
  icon: string | null;
  badge: BadgeType;
  description: string | null;
  itemCount: number;

  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;

  // References
  categoryId: string | null;
  examId: string | null;

  // Navigation config
  maxItems: number;
  showItemCount: boolean;
  featuredItemIds: string[];
  customUrl: string | null;
  metadata: Record<string, unknown>;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Computed (tree resolution)
  children?: TaxonomyNode[];
}

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION TREE (pillar-level resolved tree)
// ═══════════════════════════════════════════════════════════════════

export interface NavigationTree {
  pillar: NavigationPillar;
  label: string;
  href: string;
  icon: string | null;
  nodes: TaxonomyNode[];
  totalItemCount: number;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// PANEL DATA (desktop mega menu content)
// ═══════════════════════════════════════════════════════════════════

export interface NavigationPanelData {
  categories: TaxonomyNode[];        // left sidebar (depth=1)
  subCategories: TaxonomyNode[];     // middle panel (depth=2)
  contextual: ContextualPanelData;   // right panel
}

export interface ContextualPanelData {
  featured: NavigationItem[];
  trending: NavigationItem[];
  recentlyUpdated: NavigationItem[];
  latestUpdates: NotificationItem[];
}

export interface NavigationItem {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  href: string;
  badge: BadgeType;
  icon: string | null;
  metadata?: Record<string, string>;
}

export interface NotificationItem {
  id: string;
  title: string;
  href: string;
  timestamp: string;
  type: "result" | "notification" | "deadline" | "news";
}

// ═══════════════════════════════════════════════════════════════════
// QUICK ACCESS
// ═══════════════════════════════════════════════════════════════════

export interface QuickAccessItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: BadgeType;
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════

export interface NavigationSearchResult {
  id: string;
  slug: string;
  label: string;
  path: string;
  pillar: NavigationPillar;
  icon: string | null;
  badge: BadgeType;
  breadcrumb: string[]; // ["Government Exams", "SSC", "SSC CGL"]
  href: string;
}

// ═══════════════════════════════════════════════════════════════════
// FACETS
// ═══════════════════════════════════════════════════════════════════

export interface TaxonomyFacetValue {
  nodeId: string;
  facet: DiscoveryFacet;
  value: string;
  slug: string;
}

export interface FacetOption {
  value: string;
  slug: string;
  label: string;
  count: number;
}

// ═══════════════════════════════════════════════════════════════════
// BREADCRUMBS
// ═══════════════════════════════════════════════════════════════════

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}
