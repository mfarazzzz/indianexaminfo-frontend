/**
 * taxonomyService.ts — Navigation data resolver.
 * Supports dual mode: static (JSON file) and dynamic (Supabase ISR).
 * 
 * Static mode: reads from data/navigation.json (bundled at build time)
 * Dynamic mode: queries taxonomy_nodes table via Supabase with ISR caching
 */
import type {
  NavigationPillar,
  NavigationTree,
  TaxonomyNode,
  BreadcrumbItem,
  NavigationSearchResult,
  ContextualPanelData,
  StaticNavigationData,
  QuickAccessItem,
} from "@/types/navigation";
import { NAVIGATION_MODE, NAV_REVALIDATE_INTERVAL } from "@/lib/navigation/config";
import { PILLAR_CONFIGS } from "@/types/navigation";

// ═══════════════════════════════════════════════════════════════════
// STATIC DATA LOADER
// ═══════════════════════════════════════════════════════════════════

let _staticData: StaticNavigationData | null = null;

async function getStaticData(): Promise<StaticNavigationData> {
  if (_staticData) return _staticData;
  try {
    const data = await import("@/data/navigation.json");
    _staticData = data.default as unknown as StaticNavigationData;
    return _staticData;
  } catch {
    // Return minimal fallback
    const fallback: StaticNavigationData = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      pillars: {} as any,
      quickAccess: [],
    };
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC DATA LOADER (Supabase)
// ═══════════════════════════════════════════════════════════════════

async function getDynamicTree(pillar: NavigationPillar): Promise<TaxonomyNode[]> {
  try {
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("taxonomy_nodes")
      .select("*")
      .eq("pillar", pillar)
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("display_order", { ascending: true });

    if (error) throw error;

    return (data ?? []).map(mapDbRow);
  } catch (err) {
    console.error(`[taxonomyService] getDynamicTree(${pillar}) failed:`, err);
    return [];
  }
}

function mapDbRow(row: any): TaxonomyNode {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    pillar: row.pillar,
    parentId: row.parent_id ?? null,
    path: row.path,
    depth: row.depth,
    displayOrder: row.display_order,
    isActive: row.is_active,
    isPinned: row.is_pinned,
    icon: row.icon ?? null,
    badge: row.badge ?? null,
    description: row.description ?? null,
    itemCount: row.item_count ?? 0,
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    ogImage: row.og_image ?? null,
    categoryId: row.category_id ?? null,
    examId: row.exam_id ?? null,
    maxItems: row.max_items ?? 15,
    showItemCount: row.show_item_count ?? true,
    featuredItemIds: row.featured_item_ids ?? [],
    customUrl: row.custom_url ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TREE BUILDER (flat nodes → nested tree)
// ═══════════════════════════════════════════════════════════════════

function buildTree(flatNodes: TaxonomyNode[]): TaxonomyNode[] {
  const map = new Map<string, TaxonomyNode>();
  const roots: TaxonomyNode[] = [];

  // Initialize all nodes with empty children
  for (const node of flatNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // Build parent-child relationships
  for (const node of flatNodes) {
    const current = map.get(node.id)!;
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(current);
    } else {
      roots.push(current);
    }
  }

  return roots;
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the complete navigation tree for a single pillar.
 * Works in both static and dynamic mode.
 */
export async function getNavigationTree(pillar: NavigationPillar): Promise<NavigationTree> {
  const config = PILLAR_CONFIGS.find((p) => p.pillar === pillar);

  if (NAVIGATION_MODE === "static") {
    const staticData = await getStaticData();
    const tree = staticData.pillars[pillar];
    if (tree) return tree;
  }

  // Dynamic mode or static fallback
  if (NAVIGATION_MODE === "dynamic") {
    const flatNodes = await getDynamicTree(pillar);
    const nodes = buildTree(flatNodes);
    return {
      pillar,
      label: config?.label ?? pillar,
      href: config?.href ?? `/${pillar}`,
      icon: config?.icon ?? null,
      nodes,
      totalItemCount: flatNodes.reduce((sum, n) => sum + n.itemCount, 0),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Fallback: empty tree
  return {
    pillar,
    label: config?.label ?? pillar,
    href: config?.href ?? `/${pillar}`,
    icon: config?.icon ?? null,
    nodes: [],
    totalItemCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get all navigation trees for header rendering (all 6 pillars).
 */
export async function getAllNavigationTrees(): Promise<NavigationTree[]> {
  if (NAVIGATION_MODE === "static") {
    const staticData = await getStaticData();
    return PILLAR_CONFIGS.filter((p) => p.isEnabled).map((config) => {
      const tree = staticData.pillars[config.pillar];
      if (tree) return tree;
      return {
        pillar: config.pillar,
        label: config.label,
        href: config.href,
        icon: config.icon,
        nodes: [],
        totalItemCount: 0,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  // Dynamic mode: parallel fetch
  const trees = await Promise.all(
    PILLAR_CONFIGS.filter((p) => p.isEnabled).map((config) => getNavigationTree(config.pillar))
  );
  return trees;
}

/**
 * Get quick access items for the sticky bar.
 */
export async function getQuickAccessItems(): Promise<QuickAccessItem[]> {
  if (NAVIGATION_MODE === "static") {
    const staticData = await getStaticData();
    return staticData.quickAccess ?? [];
  }
  // Dynamic mode fallback
  return [];
}

/**
 * Resolve breadcrumbs from a materialized path.
 */
export async function resolveBreadcrumb(path: string): Promise<BreadcrumbItem[]> {
  const segments = path.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += (i === 0 ? "" : "/") + segments[i];
    const isLast = i === segments.length - 1;

    // Try to find the node in static data
    if (NAVIGATION_MODE === "static") {
      const staticData = await getStaticData();
      const pillar = segments[0] as NavigationPillar;
      const tree = staticData.pillars[pillar];
      if (tree && i === 0) {
        crumbs.push({ label: tree.label, href: tree.href, isCurrentPage: isLast });
        continue;
      }
      // Search tree for matching slug at this depth
      const node = findNodeByPath(tree?.nodes ?? [], currentPath);
      if (node) {
        crumbs.push({ label: node.label, href: `/${currentPath}`, isCurrentPage: isLast });
        continue;
      }
    }

    // Fallback: use slug as label
    crumbs.push({
      label: segments[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: `/${currentPath}`,
      isCurrentPage: isLast,
    });
  }

  return crumbs;
}

function findNodeByPath(nodes: TaxonomyNode[], targetPath: string): TaxonomyNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Search navigation nodes (client-side fuzzy over static data).
 */
export function searchNavigationStatic(
  trees: NavigationTree[],
  query: string,
  pillarFilter: NavigationPillar | null = null,
  limit = 20
): NavigationSearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: NavigationSearchResult[] = [];

  const searchTree = (nodes: TaxonomyNode[], breadcrumb: string[]) => {
    for (const node of nodes) {
      if (results.length >= limit) return;
      if (pillarFilter && node.pillar !== pillarFilter) continue;

      const matches =
        node.label.toLowerCase().includes(q) ||
        node.slug.includes(q) ||
        (node.description?.toLowerCase().includes(q) ?? false);

      if (matches) {
        results.push({
          id: node.id,
          slug: node.slug,
          label: node.label,
          path: node.path,
          pillar: node.pillar,
          icon: node.icon,
          badge: node.badge,
          breadcrumb: [...breadcrumb, node.label],
          href: node.customUrl ?? `/${node.path}`,
        });
      }

      if (node.children) {
        searchTree(node.children, [...breadcrumb, node.label]);
      }
    }
  };

  for (const tree of trees) {
    if (pillarFilter && tree.pillar !== pillarFilter) continue;
    searchTree(tree.nodes, [tree.label]);
  }

  return results;
}
