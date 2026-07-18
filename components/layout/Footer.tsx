import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getMenuBySlug, buildColumns } from "@/services/menuService";
import type { MenuItem } from "@/services/menuService";

/**
 * CMS-driven footer. Reads from `footer-nav` menu.
 * Falls back to minimal footer if DB is unavailable.
 * 4-column layout with heading groups.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  const footerMenu = await getMenuBySlug("footer-nav");

  // Flatten one level for column building
  const allItems: MenuItem[] = [];
  if (footerMenu) {
    for (const item of footerMenu.items) {
      allItems.push(item);
      if (item.children) {
        for (const child of item.children) {
          allItems.push(child);
        }
      }
    }
  }

  const columns = footerMenu ? buildColumns(allItems) : [];

  return (
    <footer className="bg-primary text-white mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Col 1: About + social — always present */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">IE</span>
              </div>
              <span className="font-heading font-bold text-white text-base">IndianExamInfo</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              India&apos;s most trusted exam information portal. Government Jobs, Entrance Exams, Board &amp; University Results.
            </p>
            <div className="flex gap-3">
              {[
                { href: siteConfig.whatsappGroup, label: "WhatsApp" },
                { href: siteConfig.telegramChannel, label: "Telegram" },
                { href: siteConfig.youtubeChannel, label: "YouTube" },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-white/50 hover:text-white transition-colors text-xs bg-white/10 px-2 py-1 rounded"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CMS-driven columns */}
          {columns.map((col) => (
            <div key={col.heading.id}>
              <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">
                {col.heading.label}
              </h3>
              <ul className="space-y-1.5">
                {col.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.url ?? "#"}
                      className="text-xs text-white/60 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Fallback if no CMS columns */}
          {columns.length === 0 && (
            <>
              <div>
                <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">Quick Links</h3>
                <ul className="space-y-1.5">
                  {[
                    { label: "Government Jobs", href: "/sarkari-naukri" },
                    { label: "Entrance Exams", href: "/entrance-exam" },
                    { label: "Board Results", href: "/board-exam" },
                    { label: "Admit Card", href: "/admit-card" },
                    { label: "Results", href: "/results" },
                  ].map((l) => (
                    <li key={l.href}><Link href={l.href} className="text-xs text-white/60 hover:text-white">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">Company</h3>
                <ul className="space-y-1.5">
                  {[
                    { label: "About Us", href: "/about" },
                    { label: "Contact", href: "/contact" },
                    { label: "Privacy Policy", href: "/privacy-policy" },
                    { label: "Disclaimer", href: "/disclaimer" },
                  ].map((l) => (
                    <li key={l.href}><Link href={l.href} className="text-xs text-white/60 hover:text-white">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {year} {siteConfig.organization.name}. Not affiliated with any government body.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
