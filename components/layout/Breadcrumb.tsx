import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/config/site";

export type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  const allItems = [{ name: "Home", href: "/" }, ...items];

  const schemaItems = allItems.map((item) => ({
    name: item.name,
    url: `${siteConfig.url}${item.href}`,
  }));

  // On mobile: show only last 2 segments
  const mobileItems = allItems.slice(-2);

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="py-2">
        {/* Desktop */}
        <ol className="hidden sm:flex items-center flex-wrap gap-0 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
          {allItems.map((item, index) => (
            <li
              key={item.href}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 shrink-0" aria-hidden="true" />
              )}
              {index === allItems.length - 1 ? (
                <span
                  itemProp="name"
                  className="text-gray-500 truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  itemProp="item"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          ))}
        </ol>

        {/* Mobile: last 2 only */}
        <ol className="flex sm:hidden items-center text-sm">
          {mobileItems.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1" aria-hidden="true" />
              )}
              {index === mobileItems.length - 1 ? (
                <span className="text-gray-500 truncate max-w-[200px]" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="text-gray-600 hover:text-primary">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
