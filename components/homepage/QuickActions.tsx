import Link from "next/link";
import { filterHubLinks } from "@/lib/hubs/contentHubs";

// Compact quick-action bar — text labels only, no icons (Part B: the module
// row carries no icons).
const actions = [
  { label: "Admit card", href: "/admit-card" },
  { label: "Result", href: "/results" },
  { label: "Answer key", href: "/answer-key" },
  { label: "Syllabus", href: "/syllabus" },
  { label: "Date sheet", href: "/date-sheet" },
] as const;

export async function QuickActions() {
  // The one rule (lib/hubs/contentHubs): show only hubs that currently render a
  // record. An empty hub drops from the strip and reappears automatically once
  // it is populated. Non-hub links are always kept.
  const visible = await filterHubLinks(actions);
  if (visible.length === 0) return null;

  return (
    <section aria-label="Quick content actions">
      <h2 className="sr-only">Quick access</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {visible.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            prefetch={false}
            className="flex items-center justify-center bg-white border border-border px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:border-gray-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
