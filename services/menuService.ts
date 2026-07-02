/**
 * menuService.ts — Reads navigation menus from Supabase menus + menu_items tables.
 *
 * The CMS manages menus via the drag-and-drop Menu Builder (src/pages/menus/MenusPage.tsx).
 * Frontend uses these to render the Header, Footer, and mobile navigation.
 *
 * Falls back to hardcoded config/navigation.ts when DB is unavailable.
 */

import { createServerClient } from "@/lib/supabase/server";

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
  children?: MenuItem[];
};

export type Menu = {
  id: string;
  slug: string;
  name: string;
  items: MenuItem[];
};

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
  };
}

/** Build a nested tree from flat items. */
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

  return roots;
}

/** Get a single menu with nested items by slug. Returns null if not found. */
export async function getMenuBySlug(slug: string): Promise<Menu | null> {
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
}

/** Get all menus (without items — for list display). */
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
