/**
 * menuService.ts — CMS-driven navigation system.
 * Reads all menus from Supabase: primary nav, mega menus, quick access bar, footer.
 * Zero hardcoded navigation items — everything is editor-managed.
 *
 * Menu architecture:
 *   primary-nav         → Top-level nav items (with mega_menu references in metadata)
 *   government-jobs-mega → 4-column mega menu
 *   entrance-exams-mega  → 4-column mega menu
 *   board-university-mega → 4-column mega menu
 *   news-mega            → Simple section links
 *   quick-access-bar     → Sticky shortcut bar
 *   footer-nav           → 4-column footer
 */

import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MenuItemType = "link" | "heading" | "divider" | "featured" | "dynamic";

export type MenuItem = {
  id: string;
  parentId: string | null;
  label: string;
  url: string | null;
  opensInNewTab: boolean;
  icon: string | null;
  badge: string | null;
  badgeColor: string | null;
  orderIndex: number;
  isActive: boolean;
  itemType: MenuItemType;
  description: string | null;
  imageUrl: string | null;
  cssClass: string | null;
  columnIndex: number;
  metadata: Record<string, unknown>;
  children?: MenuItem[];
};

export type Menu = {
  id: string;
  slug: string;
  name: string;
  items: MenuItem[];
};

export type MegaMenuColumn = {
  heading: MenuItem;
  items: MenuItem[];
  columnIndex: number;
};

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapItem(row: any): MenuItem {
  return {
    id: row.id,
    parentId: row.parent_id ?? null,
    label: row.label,
    url: row.url ?? null,
    opensInNewTab: row.opens_in_new_tab ?? false,
    icon: row.icon ?? null,
    badge: row.badge ?? null,
    badgeColor: row.badge_color ?? null,
    orderIndex: row.order_index ?? 0,
    isActive: row.is_active ?? true,
    itemType: row.item_type ?? "link",
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    cssClass: row.css_class ?? null,
    columnIndex: row.column_index ?? 0,
    metadata: row.metadata ?? {},
  };
}

/** Build nested tree from flat items */
function buildTree(flat: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem>();
  const roots: MenuItem[] = [];

  for (const item of flat) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of flat) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by orderIndex
  for (const node of map.values()) {
    if (node.children) {
      node.children.sort((a, b) => a.orderIndex - b.orderIndex);
    }
  }

  return roots.sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Organize flat items into columns (for mega menus) */
export function buildColumns(items: MenuItem[]): MegaMenuColumn[] {
  // Headings are column roots
  const headings = items.filter((i) => i.itemType === "heading" && !i.parentId);
  
  return headings
    .sort((a, b) => a.columnIndex - b.columnIndex)
    .map((heading) => ({
      heading,
      items: items
        .filter((i) => i.parentId === heading.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
      columnIndex: heading.columnIndex,
    }));
}

// ── Data fetching ─────────────────────────────────────────────────────────────

/** Fetch a menu by slug with all active items (cached 30min) */
export async function getMenuBySlug(slug: string): Promise<Menu | null> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data: menuData, error: menuErr } = await supabase
        .from("menus")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();

      if (menuErr || !menuData) return null;

      const { data: itemsData, error: itemsErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("menu_id", (menuData as any).id)
        .eq("is_active", true)
        .order("column_index")
        .order("order_index");

      if (itemsErr) throw itemsErr;

      const flat = (itemsData ?? []).map(mapItem);
      return {
        id: (menuData as any).id,
        slug: (menuData as any).slug,
        name: (menuData as any).name,
        items: buildTree(flat),
      };
    } catch (err) {
      console.error(`[menuService] getMenuBySlug(${slug}) failed:`, err);
      return null;
    }
  }, ["menus", `menu:${slug}`], { revalidate: 1800 });
}

/** Fetch multiple menus in parallel (for HeaderWithMenu) */
export async function getNavigationMenus(): Promise<{
  primaryNav: Menu | null;
  governmentJobsMega: Menu | null;
  entranceExamsMega: Menu | null;
  boardUniversityMega: Menu | null;
  newsMega: Menu | null;
  quickAccessBar: Menu | null;
  footerNav: Menu | null;
}> {
  const [primaryNav, governmentJobsMega, entranceExamsMega, boardUniversityMega, newsMega, quickAccessBar, footerNav] =
    await Promise.all([
      getMenuBySlug("primary-nav"),
      getMenuBySlug("government-jobs-mega"),
      getMenuBySlug("entrance-exams-mega"),
      getMenuBySlug("board-university-mega"),
      getMenuBySlug("news-mega"),
      getMenuBySlug("quick-access-bar"),
      getMenuBySlug("footer-nav"),
    ]);

  return { primaryNav, governmentJobsMega, entranceExamsMega, boardUniversityMega, newsMega, quickAccessBar, footerNav };
}

/** Get all menus (for CMS list display) */
export async function getAllMenus(): Promise<Omit<Menu, "items">[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("menus").select("id, slug, name").order("name");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, slug: r.slug, name: r.name }));
  } catch (err) {
    console.error("[menuService] getAllMenus failed:", err);
    return [];
  }
}
