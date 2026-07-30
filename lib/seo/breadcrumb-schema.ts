import type { BreadcrumbItem } from "@/types/navigation";

export function buildBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string = "https://indianexaminfo.com") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.isCurrentPage ? undefined : `${baseUrl}${item.href}`,
    })),
  };
}
