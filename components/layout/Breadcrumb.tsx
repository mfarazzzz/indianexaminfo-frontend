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

  // On mobile: keep the FIRST (Home) and the CURRENT crumb so the reader can always
  // climb back to the top, with an ellipsis standing in for the middle when it exists.
  // Showing only the last two (the old rule) dropped Home and the pillar, leaving no
  // way back up from a deep detail page.
  const mobileItems: (BreadcrumbItem | { ellipsis: true })[] =
    allItems.length <= 2
      ? allItems
      : [allItems[0], { ellipsis: true }, allItems[allItems.length - 1]];

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
                  prefetch={false}
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          ))}
        </ol>

        {/* Mobile: first (Home) + current, with an ellipsis for any dropped middle. */}
        <ol className="flex sm:hidden items-center text-sm">
          {mobileItems.map((item, index) => {
            const isEllipsis = "ellipsis" in item;
            return (
              <li key={isEllipsis ? "ellipsis" : item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 shrink-0" aria-hidden="true" />
                )}
                {isEllipsis ? (
                  <span className="text-gray-400" aria-hidden="true">…</span>
                ) : index === mobileItems.length - 1 ? (
                  <span className="text-gray-500 truncate max-w-[180px]" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="text-gray-600 hover:text-primary shrink-0" prefetch={false}>
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
