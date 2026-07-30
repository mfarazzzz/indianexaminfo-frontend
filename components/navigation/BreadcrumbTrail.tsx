import Link from "next/link";
import type { BreadcrumbItem } from "@/types/navigation";

interface Props {
  items: BreadcrumbItem[];
}

export function BreadcrumbTrail({ items }: Props) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-2">
      <ol className="flex items-center gap-1 text-xs text-gray-500 overflow-x-auto" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1 shrink-0" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            {index > 0 && <span className="text-gray-300" aria-hidden="true">/</span>}
            {item.isCurrentPage ? (
              <span className="text-gray-700 font-medium truncate max-w-[200px]" itemProp="name" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-primary transition-colors truncate max-w-[200px]" itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
