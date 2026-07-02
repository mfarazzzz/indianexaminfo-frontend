import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = {
  slug: string;
  label: string;
  count?: number;
  icon?: string;
};

type CategoryGridProps = {
  categories: Category[];
  basePath: string;
  className?: string;
};

export function CategoryGrid({ categories, basePath, className }: CategoryGridProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`${basePath}/${cat.slug}`}
          className="bg-card border border-border rounded p-3 hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          {cat.icon && <div className="text-2xl mb-1" aria-hidden="true">{cat.icon}</div>}
          <p className="font-semibold text-sm text-gray-800 group-hover:text-primary leading-snug">
            {cat.label}
          </p>
          {cat.count != null && (
            <p className="text-xs text-gray-400 mt-0.5">{cat.count} exams</p>
          )}
        </Link>
      ))}
    </div>
  );
}
