import Link from "next/link";

type Category = {
  heading: string;
  items: readonly { label: string; href: string }[];
};

type MegaMenuProps = {
  categories: readonly Category[];
  onClose: () => void;
};

export function MegaMenu({ categories, onClose }: MegaMenuProps) {
  return (
    <div
      className="absolute top-full left-0 z-50 mt-0 bg-white border border-border shadow-md rounded-b animate-fade-in"
      style={{ minWidth: "600px", maxHeight: "480px", overflowY: "auto" }}
      role="menu"
    >
      <div className="grid grid-cols-4 gap-0 p-4">
        {categories.map((cat) => (
          <div key={cat.heading} className="pr-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 pb-1 border-b border-border">
              {cat.heading}
            </p>
            <ul className="space-y-1">
              {cat.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className="text-sm text-gray-600 hover:text-primary block py-0.5 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
