/**
 * static-data.ts — Hardcoded navigation data for the mega menu.
 * Eliminates dependency on Supabase taxonomy_nodes table.
 */
import type { NavigationTree, TaxonomyNode, QuickAccessItem } from "@/types/navigation";
import { sarkariCategoryLabel } from "@/lib/sarkari/categories";

// ═══════════════════════════════════════════════════════════════════
// HELPER: Create a taxonomy node with sensible defaults
// ═══════════════════════════════════════════════════════════════════

let _nodeId = 0;
function node(
  overrides: Partial<TaxonomyNode> & Pick<TaxonomyNode, "slug" | "label" | "pillar" | "path" | "depth">
): TaxonomyNode {
  _nodeId++;
  return {
    id: `static-${_nodeId}`,
    parentId: null,
    displayOrder: _nodeId,
    isActive: true,
    isPinned: false,
    icon: null,
    badge: null,
    description: null,
    itemCount: 0,
    seoTitle: null,
    seoDescription: null,
    ogImage: null,
    categoryId: null,
    examId: null,
    maxItems: 15,
    showItemCount: false,
    featuredItemIds: [],
    customUrl: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GOVERNMENT EXAMS
// ═══════════════════════════════════════════════════════════════════

const govtExamCategories: TaxonomyNode[] = [
  node({
    slug: "ssc", label: "SSC", pillar: "government-exam",
    path: "sarkari-naukri/ssc", depth: 1, icon: "🏛️", isPinned: true,
    
    children: [
      node({ slug: "ssc-cgl", label: "SSC CGL", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-cgl", depth: 2, badge: "popular" }),
      node({ slug: "ssc-chsl", label: "SSC CHSL", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-chsl", depth: 2 }),
      node({ slug: "ssc-mts", label: "SSC MTS", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-mts", depth: 2 }),
      node({ slug: "ssc-gd-constable", label: "SSC GD Constable", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-gd-constable", depth: 2 }),
      node({ slug: "ssc-cpo", label: "SSC CPO", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-cpo", depth: 2 }),
      node({ slug: "ssc-je", label: "SSC JE", pillar: "government-exam", path: "sarkari-naukri/ssc/ssc-je", depth: 2 }),
    ],
  }),
  node({
    slug: "upsc", label: "UPSC", pillar: "government-exam",
    path: "sarkari-naukri/upsc", depth: 1, icon: "⭐", isPinned: true,
    
    children: [
      node({ slug: "upsc-cse", label: "UPSC CSE (IAS)", pillar: "government-exam", path: "sarkari-naukri/upsc/upsc-cse", depth: 2, badge: "popular" }),
      node({ slug: "upsc-nda", label: "UPSC NDA", pillar: "government-exam", path: "sarkari-naukri/upsc/upsc-nda", depth: 2 }),
      node({ slug: "upsc-cds", label: "UPSC CDS", pillar: "government-exam", path: "sarkari-naukri/upsc/upsc-cds", depth: 2 }),
      node({ slug: "upsc-capf", label: "UPSC CAPF", pillar: "government-exam", path: "sarkari-naukri/upsc/upsc-capf", depth: 2 }),
      node({ slug: "upsc-ese", label: "UPSC ESE", pillar: "government-exam", path: "sarkari-naukri/upsc/upsc-ese", depth: 2 }),
    ],
  }),
  node({
    slug: "banking", label: "Banking", pillar: "government-exam",
    path: "sarkari-naukri/banking", depth: 1, icon: "🏦",
    
    children: [
      node({ slug: "ibps-po", label: "IBPS PO", pillar: "government-exam", path: "sarkari-naukri/banking/ibps-po", depth: 2, badge: "popular" }),
      node({ slug: "ibps-clerk", label: "IBPS Clerk", pillar: "government-exam", path: "sarkari-naukri/banking/ibps-clerk", depth: 2 }),
      node({ slug: "sbi-po", label: "SBI PO", pillar: "government-exam", path: "sarkari-naukri/banking/sbi-po", depth: 2 }),
      node({ slug: "sbi-clerk", label: "SBI Clerk", pillar: "government-exam", path: "sarkari-naukri/banking/sbi-clerk", depth: 2 }),
      node({ slug: "rbi-grade-b", label: "RBI Grade B", pillar: "government-exam", path: "sarkari-naukri/banking/rbi-grade-b", depth: 2 }),
      node({ slug: "ibps-rrb-officer", label: "IBPS RRB", pillar: "government-exam", path: "sarkari-naukri/banking/ibps-rrb-officer", depth: 2 }),
    ],
  }),
  node({
    slug: "railway", label: "Railway", pillar: "government-exam",
    path: "sarkari-naukri/railways", depth: 1, icon: "🚂",
    
    children: [
      node({ slug: "rrb-ntpc", label: "RRB NTPC", pillar: "government-exam", path: "sarkari-naukri/railways/rrb-ntpc", depth: 2, badge: "trending" }),
      node({ slug: "rrb-group-d", label: "RRB Group D", pillar: "government-exam", path: "sarkari-naukri/railways/rrb-group-d", depth: 2 }),
      node({ slug: "rrb-alp", label: "RRB ALP", pillar: "government-exam", path: "sarkari-naukri/railways/rrb-alp", depth: 2 }),
      node({ slug: "rrb-je", label: "RRB JE", pillar: "government-exam", path: "sarkari-naukri/railways/rrb-je", depth: 2 }),
    ],
  }),
  node({
    slug: "defence", label: "Defence", pillar: "government-exam",
    path: "sarkari-naukri/defence", depth: 1, icon: "🎖️",
    
    children: [
      node({ slug: "indian-navy-agniveer", label: "Indian Navy Agniveer", pillar: "government-exam", path: "sarkari-naukri/defence/indian-navy-agniveer", depth: 2 }),
    ],
  }),
  node({
    slug: "teaching", label: "Teaching", pillar: "government-exam",
    path: "sarkari-naukri/teaching", depth: 1, icon: "📚",
    
    children: [
      node({ slug: "ctet", label: "CTET", pillar: "government-exam", path: "sarkari-naukri/teaching/ctet", depth: 2 }),
      node({ slug: "super-tet", label: "Super TET", pillar: "government-exam", path: "sarkari-naukri/teaching/super-tet", depth: 2 }),
      node({ slug: "kvs-tgt-pgt", label: "KVS", pillar: "government-exam", path: "sarkari-naukri/teaching/kvs-tgt-pgt", depth: 2 }),
      node({ slug: "dsssb-teacher", label: "DSSSB", pillar: "government-exam", path: "sarkari-naukri/teaching/dsssb-teacher", depth: 2 }),
    ],
  }),
  node({
    slug: "state-psc", label: "State PSC", pillar: "government-exam",
    path: "sarkari-naukri/state-government-jobs", depth: 1, icon: "🗺️",
    
    children: [
      node({ slug: "uppsc-pcs", label: "UPPSC", pillar: "government-exam", path: "sarkari-naukri/state-government-jobs/uppsc-pcs", depth: 2 }),
      node({ slug: "bpsc", label: "BPSC", pillar: "government-exam", path: "sarkari-naukri/state-government-jobs/bpsc", depth: 2 }),
      node({ slug: "mppsc", label: "MPPSC", pillar: "government-exam", path: "sarkari-naukri/state-government-jobs/mppsc", depth: 2 }),
      node({ slug: "rpsc-ras", label: "RPSC", pillar: "government-exam", path: "sarkari-naukri/state-government-jobs/rpsc-ras", depth: 2 }),
      node({ slug: "ukpsc", label: "UKPSC", pillar: "government-exam", path: "sarkari-naukri/state-government-jobs/ukpsc", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// GOVERNMENT JOBS — removed.
// The invented job taxonomy (Central/State Government, PSU Jobs,
// Qualification Wise, Latest Bharti) that linked to dead /govt-vacancy/…
// paths has been deleted. Real job categories are now injected server-side
// from the DB via buildNavigationTrees() (see bottom of this file).
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// ENTRANCE EXAMS
// ═══════════════════════════════════════════════════════════════════

const entranceExamCategories: TaxonomyNode[] = [
  node({
    slug: "engineering", label: "Engineering", pillar: "entrance-exam",
    path: "entrance-exam/engineering", depth: 1, icon: "⚙️", isPinned: true,
    
    children: [
      node({ slug: "jee-main", label: "JEE Main", pillar: "entrance-exam", path: "entrance-exam/engineering/jee-main", depth: 2, badge: "popular" }),
      node({ slug: "jee-advanced", label: "JEE Advanced", pillar: "entrance-exam", path: "entrance-exam/engineering/jee-advanced", depth: 2 }),
      node({ slug: "bitsat", label: "BITSAT", pillar: "entrance-exam", path: "entrance-exam/engineering/bitsat", depth: 2 }),
      node({ slug: "viteee", label: "VITEEE", pillar: "entrance-exam", path: "entrance-exam/engineering/viteee", depth: 2 }),
      node({ slug: "wbjee", label: "WBJEE", pillar: "entrance-exam", path: "entrance-exam/engineering/wbjee", depth: 2 }),
    ],
  }),
  node({
    slug: "medical", label: "Medical", pillar: "entrance-exam",
    path: "entrance-exam/medical", depth: 1, icon: "🏥", isPinned: true,
    
    children: [
      node({ slug: "neet-ug", label: "NEET UG", pillar: "entrance-exam", path: "entrance-exam/medical/neet-ug", depth: 2, badge: "popular" }),
      node({ slug: "neet-pg", label: "NEET PG", pillar: "entrance-exam", path: "entrance-exam/medical/neet-pg", depth: 2 }),
      node({ slug: "aiims", label: "AIIMS", pillar: "entrance-exam", path: "entrance-exam/medical/aiims", depth: 2 }),
      node({ slug: "jipmer", label: "JIPMER", pillar: "entrance-exam", path: "entrance-exam/medical/jipmer", depth: 2 }),
    ],
  }),
  node({
    slug: "mba", label: "MBA", pillar: "entrance-exam",
    path: "entrance-exam/mba", depth: 1, icon: "💼",
    
    children: [
      node({ slug: "cat", label: "CAT", pillar: "entrance-exam", path: "entrance-exam/mba/cat", depth: 2, badge: "popular" }),
      node({ slug: "mat", label: "MAT", pillar: "entrance-exam", path: "entrance-exam/mba/mat", depth: 2 }),
      node({ slug: "xat", label: "XAT", pillar: "entrance-exam", path: "entrance-exam/mba/xat", depth: 2 }),
      node({ slug: "cmat", label: "CMAT", pillar: "entrance-exam", path: "entrance-exam/mba/cmat", depth: 2 }),
    ],
  }),
  node({
    slug: "law", label: "Law", pillar: "entrance-exam",
    path: "entrance-exam/law", depth: 1, icon: "⚖️",
    
    children: [
      node({ slug: "clat", label: "CLAT", pillar: "entrance-exam", path: "entrance-exam/law/clat", depth: 2, badge: "popular" }),
      node({ slug: "ailet", label: "AILET", pillar: "entrance-exam", path: "entrance-exam/law/ailet", depth: 2 }),
      node({ slug: "lsat", label: "LSAT India", pillar: "entrance-exam", path: "entrance-exam/law/lsat", depth: 2 }),
    ],
  }),
  node({
    slug: "agriculture", label: "Agriculture", pillar: "entrance-exam",
    path: "entrance-exam/agriculture", depth: 1, icon: "🌾",
    
    children: [
      node({ slug: "icar-aieea", label: "ICAR AIEEA", pillar: "entrance-exam", path: "entrance-exam/agriculture/icar-aieea", depth: 2 }),
      node({ slug: "bhu-uet", label: "BHU UET", pillar: "entrance-exam", path: "entrance-exam/agriculture/bhu-uet", depth: 2 }),
    ],
  }),
  node({
    slug: "design", label: "Design", pillar: "entrance-exam",
    path: "entrance-exam/design", depth: 1, icon: "🎨",
    
    children: [
      node({ slug: "nid-dat", label: "NID DAT", pillar: "entrance-exam", path: "entrance-exam/design/nid-dat", depth: 2 }),
      node({ slug: "uceed", label: "UCEED", pillar: "entrance-exam", path: "entrance-exam/design/uceed", depth: 2 }),
      node({ slug: "nift", label: "NIFT", pillar: "entrance-exam", path: "entrance-exam/design/nift", depth: 2 }),
    ],
  }),
  node({
    slug: "defence-entrance", label: "Defence Entrance", pillar: "entrance-exam",
    path: "entrance-exam/defence-entrance", depth: 1, icon: "🎖️",
    
    children: [
      node({ slug: "cds", label: "CDS", pillar: "entrance-exam", path: "entrance-exam/defence-entrance/cds", depth: 2 }),
      node({ slug: "afcat", label: "AFCAT", pillar: "entrance-exam", path: "entrance-exam/defence-entrance/afcat", depth: 2 }),
      node({ slug: "nda", label: "NDA", pillar: "entrance-exam", path: "entrance-exam/defence-entrance/nda", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// UNIVERSITY EXAMS
// ═══════════════════════════════════════════════════════════════════

const universityCategories: TaxonomyNode[] = [
  node({
    slug: "ignou", label: "IGNOU", pillar: "university-exam",
    path: "university-exam/open-university/ignou-exam", depth: 1, icon: "🏫", isPinned: true,
    
    children: [
      node({ slug: "ignou-result", label: "IGNOU Result", pillar: "university-exam", path: "university-exam/open-university/ignou-exam/result", depth: 2, badge: "trending" }),
      node({ slug: "ignou-admission", label: "IGNOU Admission", pillar: "university-exam", path: "university-exam/open-university/ignou-exam/application", depth: 2 }),
      node({ slug: "ignou-date-sheet", label: "IGNOU Date Sheet", pillar: "university-exam", path: "university-exam/open-university/ignou-exam/date-sheet", depth: 2 }),
    ],
  }),
  node({
    slug: "du", label: "Delhi University", pillar: "university-exam",
    path: "university-exam/central-university", depth: 1, icon: "🎓",
    
    children: [
      node({ slug: "du-admission", label: "DU Admission", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
      node({ slug: "du-result", label: "DU Result", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
    ],
  }),
  node({
    slug: "bhu", label: "BHU", pillar: "university-exam",
    path: "university-exam/central-university", depth: 1, icon: "🕉️",
    
    children: [
      node({ slug: "bhu-admission", label: "BHU Admission", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
      node({ slug: "bhu-result", label: "BHU Result", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
    ],
  }),
  node({
    slug: "mjpru", label: "MJPRU", pillar: "university-exam",
    path: "university-exam/state-university", depth: 1, icon: "📖",
    
    children: [
      node({ slug: "mjpru-result", label: "MJPRU Result", pillar: "university-exam", path: "university-exam/state-university", depth: 2 }),
      node({ slug: "mjpru-date-sheet", label: "MJPRU Date Sheet", pillar: "university-exam", path: "university-exam/state-university", depth: 2 }),
    ],
  }),
  node({
    slug: "other-universities", label: "Other Universities", pillar: "university-exam",
    path: "university-exam/state-university", depth: 1, icon: "🏛️",
    
    children: [
      node({ slug: "amu", label: "AMU", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
      node({ slug: "jnu", label: "JNU", pillar: "university-exam", path: "university-exam/central-university", depth: 2 }),
      node({ slug: "lucknow-university", label: "Lucknow University", pillar: "university-exam", path: "university-exam/state-university", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// BOARD EXAMS
// ═══════════════════════════════════════════════════════════════════

const boardExamCategories: TaxonomyNode[] = [
  node({
    slug: "cbse", label: "CBSE", pillar: "board-exam",
    path: "board-exam/cbse", depth: 1, icon: "📘", isPinned: true,
    
    children: [
      node({ slug: "cbse-class-10", label: "CBSE Class 10", pillar: "board-exam", path: "board-exam/cbse/cbse-class-10", depth: 2, badge: "popular" }),
      node({ slug: "cbse-class-12", label: "CBSE Class 12", pillar: "board-exam", path: "board-exam/cbse/cbse-class-12", depth: 2, badge: "popular" }),
      node({ slug: "cbse-class-10-result", label: "CBSE 10th Result", pillar: "board-exam", path: "board-exam/cbse/cbse-class-10/result", depth: 2, badge: "trending" }),
      node({ slug: "cbse-class-12-result", label: "CBSE 12th Result", pillar: "board-exam", path: "board-exam/cbse/cbse-class-12/result", depth: 2, badge: "trending" }),
      node({ slug: "cbse-class-10-date-sheet", label: "CBSE Date Sheet", pillar: "board-exam", path: "board-exam/cbse/cbse-class-10/date-sheet", depth: 2 }),
    ],
  }),
  node({
    slug: "up-board", label: "UP Board", pillar: "board-exam",
    path: "board-exam/up-board", depth: 1, icon: "📗", isPinned: true,
    
    children: [
      node({ slug: "up-board-class-10", label: "UP Board Class 10", pillar: "board-exam", path: "board-exam/up-board", depth: 2 }),
      node({ slug: "up-board-class-12", label: "UP Board Class 12", pillar: "board-exam", path: "board-exam/up-board", depth: 2 }),
      node({ slug: "up-board-result", label: "UP Board Result", pillar: "board-exam", path: "board-exam/up-board", depth: 2, badge: "popular" }),
    ],
  }),
  node({
    slug: "bihar-board", label: "Bihar Board", pillar: "board-exam",
    path: "board-exam/bihar-board", depth: 1, icon: "📕",
    
    children: [
      node({ slug: "bseb-10th", label: "BSEB 10th", pillar: "board-exam", path: "board-exam/bihar-board", depth: 2 }),
      node({ slug: "bseb-12th", label: "BSEB 12th", pillar: "board-exam", path: "board-exam/bihar-board", depth: 2 }),
    ],
  }),
  node({
    slug: "mp-board", label: "MP Board", pillar: "board-exam",
    path: "board-exam/mp-board", depth: 1, icon: "📙",
    
    children: [
      node({ slug: "mp-board-result", label: "MP Board Result", pillar: "board-exam", path: "board-exam/mp-board", depth: 2 }),
    ],
  }),
  node({
    slug: "haryana-board", label: "Haryana Board (BSEH)", pillar: "board-exam",
    path: "board-exam/haryana-board", depth: 1, icon: "📒",
    
    children: [
      node({ slug: "bseh-result", label: "BSEH Result", pillar: "board-exam", path: "board-exam/haryana-board", depth: 2 }),
    ],
  }),
  node({
    slug: "rajasthan-board", label: "Rajasthan Board (RBSE)", pillar: "board-exam",
    path: "board-exam/rajasthan-board", depth: 1, icon: "📓",
    
    children: [
      node({ slug: "rbse-result", label: "RBSE Result", pillar: "board-exam", path: "board-exam/rajasthan-board", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════════

const newsCategories: TaxonomyNode[] = [
  node({
    slug: "blog", label: "Blog", pillar: "news",
    path: "news/blog", depth: 1, icon: "✍️", isPinned: true,
    
    children: [
      node({ slug: "exam-prep", label: "Exam Preparation", pillar: "news", path: "news/exam-prep", depth: 2, badge: "popular" }),
      node({ slug: "career-guidance", label: "Career Guidance", pillar: "news", path: "news/career-guidance", depth: 2 }),
      node({ slug: "opinion", label: "Opinion", pillar: "news", path: "news/opinion", depth: 2 }),
      node({ slug: "student-life", label: "Student Life", pillar: "news", path: "news/student-life", depth: 2 }),
    ],
  }),
  node({
    slug: "article", label: "Articles", pillar: "news",
    path: "news/article", depth: 1, icon: "📝", isPinned: true,
    
    children: [
      node({ slug: "education-news-articles", label: "Education News", pillar: "news", path: "news/education-news", depth: 2, badge: "trending" }),
      node({ slug: "edtech-articles", label: "EdTech", pillar: "news", path: "news/edtech", depth: 2 }),
      node({ slug: "study-abroad-articles", label: "Study Abroad", pillar: "news", path: "news/study-abroad", depth: 2 }),
    ],
  }),
  node({
    slug: "scholarship", label: "Scholarship", pillar: "news",
    path: "news/scholarship", depth: 1, icon: "🎓", isPinned: true, badge: "new",
    
    children: [
      node({ slug: "govt-scholarship", label: "Government Scholarships", pillar: "news", path: "news/scholarship", depth: 2 }),
      node({ slug: "private-scholarship", label: "Private Scholarships", pillar: "news", path: "news/scholarship", depth: 2 }),
      node({ slug: "international-scholarship", label: "International Scholarships", pillar: "news", path: "news/scholarship", depth: 2 }),
    ],
  }),
  node({
    slug: "education-news", label: "Education News", pillar: "news",
    path: "news/education-news", depth: 1, icon: "📰",
    
    children: [
      node({ slug: "policy-updates", label: "Policy Updates", pillar: "news", path: "news/education-news", depth: 2 }),
      node({ slug: "exam-schedule", label: "Exam Schedule", pillar: "news", path: "news/education-news", depth: 2 }),
      node({ slug: "breaking-news", label: "Breaking News", pillar: "news", path: "news/education-news", depth: 2 }),
    ],
  }),
  node({
    slug: "sarkari-result", label: "Sarkari Result", pillar: "news",
    path: "news/education-news", depth: 1, icon: "📋", badge: "trending",
    
    children: [
      node({ slug: "latest-results", label: "Latest Results", pillar: "news", path: "news/education-news", depth: 2 }),
      node({ slug: "merit-list", label: "Merit List", pillar: "news", path: "news/education-news", depth: 2 }),
      node({ slug: "cut-off", label: "Cut Off", pillar: "news", path: "news/education-news", depth: 2 }),
    ],
  }),
  node({
    slug: "admit-card", label: "Admit Card", pillar: "news",
    path: "news/education-news", depth: 1, icon: "🎫",
    
    children: [
      node({ slug: "latest-admit-cards", label: "Latest Admit Cards", pillar: "news", path: "news/education-news", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// ASSEMBLED NAVIGATION TREES
// ═══════════════════════════════════════════════════════════════════

export const STATIC_NAVIGATION_TREES: NavigationTree[] = [
  {
    // Government Exams and Government Vacancy are ONE nav item. Selection method
    // (competitive exam vs direct recruitment) is a filter on the /sarkari-naukri
    // page, never a separate doorway. Do not split this into two nav items again.
    pillar: "government-exam",
    label: "Sarkari Naukri",
    href: "/sarkari-naukri",
    icon: "🏛️",
    // Base nodes are the curated competitive-exam groupings only. The real
    // job categories are injected server-side by buildNavigationTrees() from
    // getCategoryList(); this static list is the no-DB fallback. The old
    // invented govt-vacancy taxonomy (→ /govt-vacancy/… 404s) was removed.
    nodes: [...govtExamCategories],
    totalItemCount: 361,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "entrance-exam",
    // UI label only — the route stays /entrance-exam and SEO copy stays "Entrance Exam".
    label: "Admissions",
    href: "/entrance-exam",
    icon: "🎓",
    nodes: entranceExamCategories,
    totalItemCount: 123,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "board-exam",
    label: "Board Exams",
    href: "/board-exam",
    icon: "📘",
    nodes: boardExamCategories,
    totalItemCount: 76,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "university-exam",
    label: "University",
    href: "/university-exam",
    icon: "🏫",
    nodes: universityCategories,
    totalItemCount: 45,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "news",
    label: "News",
    href: "/news",
    icon: "📰",
    nodes: newsCategories,
    totalItemCount: 50,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════════════════
// QUICK ACCESS ITEMS
// ═══════════════════════════════════════════════════════════════════

export const STATIC_QUICK_ACCESS: QuickAccessItem[] = [
  { id: "qa-1", label: "NEET UG", href: "/entrance-exam/medical/neet-ug", icon: "🏥" },
  { id: "qa-2", label: "JEE Main", href: "/entrance-exam/engineering/jee-main", icon: "⚙️" },
  { id: "qa-3", label: "SSC CGL", href: "/sarkari-naukri/ssc/ssc-cgl", icon: "🏛️" },
  { id: "qa-4", label: "UPSC", href: "/sarkari-naukri/upsc/upsc-cse", icon: "⭐" },
  { id: "qa-5", label: "IBPS PO", href: "/sarkari-naukri/banking/ibps-po", icon: "🏦" },
  { id: "qa-6", label: "CAT", href: "/entrance-exam/mba/cat", icon: "💼" },
  { id: "qa-7", label: "UP Board Result", href: "/board-exam/up-board/up-board-12th-result", icon: "📗" },
  { id: "qa-8", label: "CBSE Date Sheet", href: "/board-exam/cbse/cbse-date-sheet", icon: "📘" },
];

// ═══════════════════════════════════════════════════════════════════
// REAL SARKARI-NAUKRI CATEGORIES (server-injected)
// ═══════════════════════════════════════════════════════════════════
//
// The old `govtJobCategories` above (Central Government / State Government /
// PSU Jobs / Qualification Wise / Latest Bharti) were an INVENTED taxonomy:
// their leaves linked to `/govt-vacancy/…` paths that map to no route and 404.
// They are no longer part of the assembled tree.
//
// Instead, HeaderWithMenu (a server component) fetches the REAL distinct
// `sarkari_naukri.category` values with their published counts via
// getCategoryList(), and calls buildGovtJobCategoryNodes() to turn them into
// depth-1 nodes — grouped by count, highest first — each linking to the real
// working listing route `/sarkari-naukri/{category}`.
//
// sarkariCategoryLabel() (lib/sarkari/categories.ts) is the ONE source of
// display names, shared with the listing route itself, so the menu label and
// the page H1 always agree.

/**
 * Build depth-1 category nodes for the "Sarkari Naukri" pillar from the real
 * distinct `sarkari_naukri.category` values. Input is expected pre-sorted by
 * count desc (as getCategoryList returns it); we preserve that order and also
 * carry the count so the sidebar can show it. Each node links to the real
 * `/sarkari-naukri/{category}` listing route (customUrl), which filters by
 * category and 404s when empty — never the unfiltered page.
 */
export function buildGovtJobCategoryNodes(
  categories: { category: string; count: number }[]
): TaxonomyNode[] {
  return categories.map((c, i) => ({
    id: `sarkari-cat-${c.category}`,
    slug: c.category,
    label: sarkariCategoryLabel(c.category),
    pillar: "government-exam" as const,
    parentId: null,
    path: `sarkari-naukri/${c.category}`,
    depth: 1,
    displayOrder: i,
    isActive: true,
    isPinned: false,
    icon: null,
    badge: null,
    description: null,
    itemCount: c.count,
    seoTitle: null,
    seoDescription: null,
    ogImage: null,
    categoryId: null,
    examId: null,
    maxItems: 15,
    showItemCount: true,
    featuredItemIds: [],
    customUrl: `/sarkari-naukri/${c.category}`,
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    children: [],
  }));
}

/**
 * Assemble the full navigation trees with the REAL sarkari-naukri categories
 * injected into the government-exam pillar. Called server-side by
 * HeaderWithMenu. The competitive-exam groupings (SSC, UPSC, Banking, …) stay
 * as curated static nodes; the invented job taxonomy is replaced by the real,
 * count-ordered categories. If the fetch returns nothing (DB error / empty),
 * we fall back to just the competitive-exam categories rather than the dead
 * invented ones.
 */
// ═══════════════════════════════════════════════════════════════════
// REAL UNIVERSITY RECORDS (server-injected)
// ═══════════════════════════════════════════════════════════════════
//
// The old hand-built universityCategories (IGNOU/DU/BHU/MJPRU/Other Universities)
// pointed leaves at generic /university-exam/central-university landings and
// omitted most real records (Jamia, Anna, Osmania, …). They are replaced by the
// REAL published university-exam records, grouped:
//   - "Central Universities" — every record whose category = central-university,
//     PLUS IGNOU (created by Act of Parliament; a central university even though
//     its category is open-university).
//   - then one group PER REGION (state/UT), largest group first, holding every
//     other university in that region regardless of category (state, deemed,
//     professional, open) — a reader browsing Rajasthan expects BITS there.
// Each leaf links to its real /university-exam/{category}/{slug} record.

/** One published university-exam record, as HeaderWithMenu fetches it. */
export interface UniversityNavRecord {
  slug: string;
  shortName: string;
  category: string;         // central-university | state-university | deemed-university | ...
  region: string;           // regions.slug (all-india for central)
  regionLabel: string;      // regions.label
}

/** IGNOU is central by charter though its category is open-university. */
const CENTRAL_BY_CHARTER = new Set(["ignou-exam"]);

function uniLeaf(rec: UniversityNavRecord, order: number): TaxonomyNode {
  return {
    id: `uni-${rec.slug}`,
    slug: rec.slug,
    label: rec.shortName || rec.slug,
    pillar: "university-exam" as const,
    parentId: null,
    path: `university-exam/${rec.category}/${rec.slug}`,
    depth: 2,
    displayOrder: order,
    isActive: true,
    isPinned: false,
    icon: null,
    badge: null,
    description: null,
    itemCount: 0,
    seoTitle: null,
    seoDescription: null,
    ogImage: null,
    categoryId: null,
    examId: null,
    maxItems: 15,
    showItemCount: false,
    featuredItemIds: [],
    customUrl: `/university-exam/${rec.category}/${rec.slug}`,
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    children: [],
  };
}

function uniGroup(
  slug: string,
  label: string,
  children: TaxonomyNode[],
  order: number,
  isPinned = false
): TaxonomyNode {
  return {
    id: `uni-group-${slug}`,
    slug,
    label,
    pillar: "university-exam" as const,
    parentId: null,
    // Group has no page of its own; the group's "View All" falls back to the pillar.
    path: "university-exam",
    depth: 1,
    displayOrder: order,
    isActive: true,
    isPinned,
    icon: null,
    badge: null,
    description: null,
    itemCount: children.length,
    seoTitle: null,
    seoDescription: null,
    ogImage: null,
    categoryId: null,
    examId: null,
    maxItems: 30,
    showItemCount: true,
    featuredItemIds: [],
    customUrl: "/university-exam",
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    children,
  };
}

/**
 * Build the university-exam pillar's depth-1 groups from real records:
 * Central Universities first, then each region (largest first). Returns [] if
 * no records (caller then keeps the static fallback).
 */
export function buildUniversityGroupNodes(records: UniversityNavRecord[]): TaxonomyNode[] {
  if (records.length === 0) return [];

  const isCentral = (r: UniversityNavRecord) =>
    r.category === "central-university" || CENTRAL_BY_CHARTER.has(r.slug);

  const central = records.filter(isCentral).sort((a, b) => a.shortName.localeCompare(b.shortName));

  // Non-central grouped by region.
  const byRegion = new Map<string, { label: string; recs: UniversityNavRecord[] }>();
  for (const r of records) {
    if (isCentral(r)) continue;
    if (!byRegion.has(r.region)) byRegion.set(r.region, { label: r.regionLabel, recs: [] });
    byRegion.get(r.region)!.recs.push(r);
  }

  const regionGroups = [...byRegion.entries()]
    .map(([slug, g]) => ({ slug, label: g.label, recs: g.recs }))
    // Largest group first, then alphabetical by label for stable ties.
    .sort((a, b) => b.recs.length - a.recs.length || a.label.localeCompare(b.label));

  const groups: TaxonomyNode[] = [];
  let order = 0;
  if (central.length > 0) {
    groups.push(
      uniGroup(
        "central-universities",
        "Central Universities",
        central.map((r, i) => uniLeaf(r, i)),
        order++,
        true // pinned — the marquee group opens the panel
      )
    );
  }
  for (const g of regionGroups) {
    const sorted = [...g.recs].sort((a, b) => a.shortName.localeCompare(b.shortName));
    groups.push(uniGroup(`region-${g.slug}`, g.label, sorted.map((r, i) => uniLeaf(r, i)), order++));
  }
  return groups;
}

export function buildNavigationTrees(
  realCategories: { category: string; count: number }[],
  universityRecords: UniversityNavRecord[] = []
): NavigationTree[] {
  const realJobNodes = buildGovtJobCategoryNodes(realCategories);
  const universityGroups = buildUniversityGroupNodes(universityRecords);
  return STATIC_NAVIGATION_TREES.map((tree) => {
    if (tree.pillar === "government-exam") {
      return { ...tree, nodes: [...govtExamCategories, ...realJobNodes] };
    }
    if (tree.pillar === "university-exam" && universityGroups.length > 0) {
      // Replace the hand-built universityCategories with the real, grouped records.
      return { ...tree, nodes: universityGroups };
    }
    return tree;
  });
}
