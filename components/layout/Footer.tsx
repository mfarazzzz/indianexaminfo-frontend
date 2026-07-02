import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1: About + social */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">IE</span>
              </div>
              <span className="font-heading font-bold text-white text-base">IndianExamInfo</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              India&apos;s most trusted exam information portal. Latest Sarkari Naukri, Entrance Exams, Board &amp; University Results.
            </p>
            <div className="flex gap-3">
              {[
                { href: siteConfig.whatsappGroup,  label: "WhatsApp", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
                { href: siteConfig.telegramChannel, label: "Telegram", path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
                { href: siteConfig.youtubeChannel,  label: "YouTube",  path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
              ].map((s) => (
                <Link key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="text-white/50 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Col 2: Sarkari Naukri */}
          <div>
            <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">Sarkari Naukri</h3>
            <ul className="space-y-1.5">
              {[
                { label: "UPSC Civil Services", href: "/sarkari-naukri/upsc/civil-services" },
                { label: "SSC CGL",             href: "/sarkari-naukri/ssc/ssc-cgl" },
                { label: "IBPS PO",             href: "/sarkari-naukri/banking/ibps-po" },
                { label: "SBI PO",              href: "/sarkari-naukri/banking/sbi-po" },
                { label: "RRB NTPC",            href: "/sarkari-naukri/railways/rrb-ntpc" },
                { label: "Agniveer Army",       href: "/sarkari-naukri/defence/agniveer-army" },
                { label: "UP Police",           href: "/sarkari-naukri/police/up-police-constable" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/sarkari-naukri" className="text-xs text-blue-300 hover:text-white font-medium">View All Jobs →</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Entrance + Board */}
          <div>
            <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">Entrance &amp; Board</h3>
            <ul className="space-y-1.5">
              {[
                { label: "JEE Main",    href: "/entrance-exam/engineering/jee-main" },
                { label: "NEET UG",     href: "/entrance-exam/medical/neet-ug" },
                { label: "CAT",         href: "/entrance-exam/mba/cat" },
                { label: "CLAT",        href: "/entrance-exam/law/clat-ug" },
                { label: "GATE",        href: "/entrance-exam/science-pg/gate" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
              <li className="pt-2 mt-1 border-t border-white/10">
                {[
                  { label: "CBSE Class 12", href: "/board-exam/cbse/class-12" },
                  { label: "UP Board",      href: "/board-exam/state/up-board" },
                  { label: "Bihar Board",   href: "/board-exam/state/bihar-board" },
                  { label: "IGNOU",         href: "/board-exam/university/ignou" },
                  { label: "MJPRU",         href: "/board-exam/university/mjpru" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="text-xs text-white/60 hover:text-white block mb-1.5 transition-colors">{l.label}</Link>
                ))}
              </li>
            </ul>
          </div>

          {/* Col 4: Blog + Content Hub */}
          <div>
            <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">Blog &amp; News</h3>
            <ul className="space-y-1.5 mb-2">
              {[
                { label: "Education News",    href: "/blog/education-news" },
                { label: "Exam Preparation",  href: "/blog/exam-prep" },
                { label: "Career Guidance",   href: "/blog/career-guidance" },
                { label: "Scholarships",      href: "/blog/scholarship" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
            {/* Content Hub divider */}
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-3 mb-2 border-t border-gray-700 pt-3">
              Content Hub
            </div>
            <ul className="space-y-1.5">
              {[
                { label: "Admit Card",      href: "/admit-card" },
                { label: "Results",         href: "/results" },
                { label: "Answer Key",      href: "/answer-key" },
                { label: "Syllabus",        href: "/syllabus" },
                { label: "Date Sheet",      href: "/date-sheet" },
                { label: "Previous Papers", href: "/previous-papers" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {year} {siteConfig.organization.name}. Not affiliated with any government body.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
