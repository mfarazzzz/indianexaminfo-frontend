import Link from "next/link";
import type { Menu, MenuItem } from "@/services/menuService";
import { buildColumns } from "@/services/menuService";

type MegaMenuProps = {
  menu: Menu;
  onClose: () => void;
};

/**
 * CMS-driven mega menu. Renders a multi-column grid based on menu_items data.
 * Columns are defined by heading-type items; children are the column content.
 * Supports: icons, badges, descriptions, featured items.
 */
export function CmsMegaMenu({ menu, onClose }: MegaMenuProps) {
  // Build flat item list from nested tree (flatten one level)
  const allItems: MenuItem[] = [];
  for (const item of menu.items) {
    allItems.push(item);
    if (item.children) {
      for (const child of item.children) {
        allItems.push(child);
      }
    }
  }

  const columns = buildColumns(allItems);
  const columnCount = Math.max(columns.length, 1);

  return (
    <div
      className="absolute top-full left-0 z-50 mt-0 bg-white border border-border shadow-xl rounded-b-lg animate-fade-in"
      style={{ minWidth: `${Math.min(columnCount * 200, 800)}px` }}
      role="menu"
      aria-label={menu.name}
    >
      <div className={`grid grid-cols-${columnCount} gap-0 p-5`} style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
        {columns.map((col) => (
          <div key={col.heading.id} className="pr-4 last:pr-0">
            {/* Column heading */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 pb-1.5 border-b border-border flex items-center gap-1.5">
              {col.heading.icon && <span className="text-sm">{col.heading.icon}</span>}
              {col.heading.label}
            </p>
            {/* Column items */}
            <ul className="space-y-0.5">
              {col.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url ?? "#"}
                    onClick={onClose}
                    role="menuitem"
                    className="group flex items-center gap-2 py-1.5 px-1 -mx-1 rounded text-sm text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {item.icon && <span className="text-base shrink-0 opacity-70 group-hover:opacity-100">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {typeof item.metadata?.description === "string" && (
                    <p className="text-[10px] text-gray-400 pl-7 -mt-0.5 mb-1">
                      {item.metadata.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple dropdown for News (single column, flat list)
 */
export function SimpleDropdown({ menu, onClose }: MegaMenuProps) {
  return (
    <div
      className="absolute top-full left-0 z-50 mt-0 bg-white border border-border shadow-lg rounded-b-lg animate-fade-in min-w-[200px]"
      role="menu"
      aria-label={menu.name}
    >
      <div className="py-2">
        {menu.items.map((item) => (
          <Link
            key={item.id}
            href={item.url ?? "#"}
            onClick={onClose}
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Legacy export for backward compatibility during transition
export { CmsMegaMenu as MegaMenu };
