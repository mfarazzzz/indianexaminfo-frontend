import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — IndianExamInfo",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-xl">
      <div className="text-6xl font-heading font-bold text-primary mb-4">404</div>
      <h1 className="font-heading font-bold text-xl text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching or browse our popular sections below.
      </p>

      {/* Search */}
      <form action="/search" method="get" className="flex items-center gap-2 mb-8 border border-border rounded px-3 py-2 bg-white">
        <input
          type="search"
          name="q"
          placeholder="Search exams, results, admit cards..."
          className="flex-1 text-sm outline-none"
          aria-label="Search"
        />
        <button type="submit" className="bg-primary text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-primary-600 transition-colors">
          Search
        </button>
      </form>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: "🏛 Sarkari Naukri", href: "/sarkari-naukri" },
          { label: "🎓 Entrance Exam", href: "/entrance-exam" },
          { label: "📚 Board Exam", href: "/board-exam" },
          { label: "📰 Blog & News", href: "/blog" },
          { label: "📄 Admit Card", href: "/admit-card" },
          { label: "📊 Results", href: "/results" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="p-3 bg-card border border-border rounded text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors">
            {item.label}
          </Link>
        ))}
      </div>

      <Link href="/" className="text-primary font-medium hover:underline text-sm">← Back to Homepage</Link>
    </div>
  );
}
