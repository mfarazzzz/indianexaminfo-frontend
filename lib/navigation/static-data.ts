/**
 * static-data.ts — Hardcoded navigation data for the mega menu.
 * Eliminates dependency on Supabase taxonomy_nodes table.
 */
import type { NavigationTree, TaxonomyNode, QuickAccessItem } from "@/types/navigation";

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
    path: "government-exam/ssc", depth: 1, icon: "🏛️", isPinned: true,
    itemCount: 12, showItemCount: true,
    children: [
      node({ slug: "ssc-cgl", label: "SSC CGL", pillar: "government-exam", path: "government-exam/ssc/ssc-cgl", depth: 2, badge: "popular" }),
      node({ slug: "ssc-chsl", label: "SSC CHSL", pillar: "government-exam", path: "government-exam/ssc/ssc-chsl", depth: 2 }),
      node({ slug: "ssc-mts", label: "SSC MTS", pillar: "government-exam", path: "government-exam/ssc/ssc-mts", depth: 2 }),
      node({ slug: "ssc-gd", label: "SSC GD Constable", pillar: "government-exam", path: "government-exam/ssc/ssc-gd", depth: 2 }),
      node({ slug: "ssc-cpo", label: "SSC CPO", pillar: "government-exam", path: "government-exam/ssc/ssc-cpo", depth: 2 }),
      node({ slug: "ssc-je", label: "SSC JE", pillar: "government-exam", path: "government-exam/ssc/ssc-je", depth: 2 }),
    ],
  }),
  node({
    slug: "upsc", label: "UPSC", pillar: "government-exam",
    path: "government-exam/upsc", depth: 1, icon: "⭐", isPinned: true,
    itemCount: 8, showItemCount: true,
    children: [
      node({ slug: "upsc-cse", label: "UPSC CSE (IAS)", pillar: "government-exam", path: "government-exam/upsc/upsc-cse", depth: 2, badge: "popular" }),
      node({ slug: "upsc-nda", label: "UPSC NDA", pillar: "government-exam", path: "government-exam/upsc/upsc-nda", depth: 2 }),
      node({ slug: "upsc-cds", label: "UPSC CDS", pillar: "government-exam", path: "government-exam/upsc/upsc-cds", depth: 2 }),
      node({ slug: "upsc-capf", label: "UPSC CAPF", pillar: "government-exam", path: "government-exam/upsc/upsc-capf", depth: 2 }),
      node({ slug: "upsc-ese", label: "UPSC ESE", pillar: "government-exam", path: "government-exam/upsc/upsc-ese", depth: 2 }),
    ],
  }),
  node({
    slug: "banking", label: "Banking", pillar: "government-exam",
    path: "government-exam/banking", depth: 1, icon: "🏦",
    itemCount: 10, showItemCount: true,
    children: [
      node({ slug: "ibps-po", label: "IBPS PO", pillar: "government-exam", path: "government-exam/banking/ibps-po", depth: 2, badge: "popular" }),
      node({ slug: "ibps-clerk", label: "IBPS Clerk", pillar: "government-exam", path: "government-exam/banking/ibps-clerk", depth: 2 }),
      node({ slug: "sbi-po", label: "SBI PO", pillar: "government-exam", path: "government-exam/banking/sbi-po", depth: 2 }),
      node({ slug: "sbi-clerk", label: "SBI Clerk", pillar: "government-exam", path: "government-exam/banking/sbi-clerk", depth: 2 }),
      node({ slug: "rbi-grade-b", label: "RBI Grade B", pillar: "government-exam", path: "government-exam/banking/rbi-grade-b", depth: 2 }),
      node({ slug: "ibps-rrb", label: "IBPS RRB", pillar: "government-exam", path: "government-exam/banking/ibps-rrb", depth: 2 }),
    ],
  }),
  node({
    slug: "railway", label: "Railway", pillar: "government-exam",
    path: "government-exam/railway", depth: 1, icon: "🚂",
    itemCount: 6, showItemCount: true,
    children: [
      node({ slug: "rrb-ntpc", label: "RRB NTPC", pillar: "government-exam", path: "government-exam/railway/rrb-ntpc", depth: 2, badge: "trending" }),
      node({ slug: "rrb-group-d", label: "RRB Group D", pillar: "government-exam", path: "government-exam/railway/rrb-group-d", depth: 2 }),
      node({ slug: "rrb-alp", label: "RRB ALP", pillar: "government-exam", path: "government-exam/railway/rrb-alp", depth: 2 }),
      node({ slug: "rrb-je", label: "RRB JE", pillar: "government-exam", path: "government-exam/railway/rrb-je", depth: 2 }),
    ],
  }),
  node({
    slug: "defence", label: "Defence", pillar: "government-exam",
    path: "government-exam/defence", depth: 1, icon: "🎖️",
    itemCount: 5, showItemCount: true,
    children: [
      node({ slug: "cds", label: "CDS", pillar: "government-exam", path: "government-exam/defence/cds", depth: 2 }),
      node({ slug: "afcat", label: "AFCAT", pillar: "government-exam", path: "government-exam/defence/afcat", depth: 2 }),
      node({ slug: "nda", label: "NDA", pillar: "government-exam", path: "government-exam/defence/nda", depth: 2 }),
      node({ slug: "indian-navy", label: "Indian Navy", pillar: "government-exam", path: "government-exam/defence/indian-navy", depth: 2 }),
    ],
  }),
  node({
    slug: "teaching", label: "Teaching", pillar: "government-exam",
    path: "government-exam/teaching", depth: 1, icon: "📚",
    itemCount: 4, showItemCount: true,
    children: [
      node({ slug: "ctet", label: "CTET", pillar: "government-exam", path: "government-exam/teaching/ctet", depth: 2 }),
      node({ slug: "super-tet", label: "Super TET", pillar: "government-exam", path: "government-exam/teaching/super-tet", depth: 2 }),
      node({ slug: "kvs", label: "KVS", pillar: "government-exam", path: "government-exam/teaching/kvs", depth: 2 }),
      node({ slug: "dsssb", label: "DSSSB", pillar: "government-exam", path: "government-exam/teaching/dsssb", depth: 2 }),
    ],
  }),
  node({
    slug: "state-psc", label: "State PSC", pillar: "government-exam",
    path: "government-exam/state-psc", depth: 1, icon: "🗺️",
    itemCount: 6, showItemCount: true,
    children: [
      node({ slug: "uppsc", label: "UPPSC", pillar: "government-exam", path: "government-exam/state-psc/uppsc", depth: 2 }),
      node({ slug: "bpsc", label: "BPSC", pillar: "government-exam", path: "government-exam/state-psc/bpsc", depth: 2 }),
      node({ slug: "mppsc", label: "MPPSC", pillar: "government-exam", path: "government-exam/state-psc/mppsc", depth: 2 }),
      node({ slug: "rpsc", label: "RPSC", pillar: "government-exam", path: "government-exam/state-psc/rpsc", depth: 2 }),
      node({ slug: "ukpsc", label: "UKPSC", pillar: "government-exam", path: "government-exam/state-psc/ukpsc", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// GOVERNMENT JOBS
// ═══════════════════════════════════════════════════════════════════

const govtJobCategories: TaxonomyNode[] = [
  node({
    slug: "central-govt", label: "Central Government", pillar: "government-jobs",
    path: "government-jobs/central-govt", depth: 1, icon: "🏛️", isPinned: true,
    itemCount: 15, showItemCount: true,
    children: [
      node({ slug: "ssc-jobs", label: "SSC Jobs", pillar: "government-jobs", path: "government-jobs/central-govt/ssc-jobs", depth: 2, badge: "popular" }),
      node({ slug: "railway-jobs", label: "Railway Jobs", pillar: "government-jobs", path: "government-jobs/central-govt/railway-jobs", depth: 2 }),
      node({ slug: "banking-jobs", label: "Banking Jobs", pillar: "government-jobs", path: "government-jobs/central-govt/banking-jobs", depth: 2 }),
      node({ slug: "defence-jobs", label: "Defence Jobs", pillar: "government-jobs", path: "government-jobs/central-govt/defence-jobs", depth: 2 }),
      node({ slug: "police-jobs", label: "Police Jobs", pillar: "government-jobs", path: "government-jobs/central-govt/police-jobs", depth: 2 }),
    ],
  }),
  node({
    slug: "state-govt", label: "State Government", pillar: "government-jobs",
    path: "government-jobs/state-govt", depth: 1, icon: "🗺️",
    itemCount: 20, showItemCount: true,
    children: [
      node({ slug: "up-govt-jobs", label: "UP Govt Jobs", pillar: "government-jobs", path: "government-jobs/state-govt/up-govt-jobs", depth: 2 }),
      node({ slug: "bihar-govt-jobs", label: "Bihar Govt Jobs", pillar: "government-jobs", path: "government-jobs/state-govt/bihar-govt-jobs", depth: 2 }),
      node({ slug: "mp-govt-jobs", label: "MP Govt Jobs", pillar: "government-jobs", path: "government-jobs/state-govt/mp-govt-jobs", depth: 2 }),
      node({ slug: "rajasthan-govt-jobs", label: "Rajasthan Govt Jobs", pillar: "government-jobs", path: "government-jobs/state-govt/rajasthan-govt-jobs", depth: 2 }),
      node({ slug: "maharashtra-govt-jobs", label: "Maharashtra Govt Jobs", pillar: "government-jobs", path: "government-jobs/state-govt/maharashtra-govt-jobs", depth: 2 }),
    ],
  }),
  node({
    slug: "psu-jobs", label: "PSU Jobs", pillar: "government-jobs",
    path: "government-jobs/psu-jobs", depth: 1, icon: "🏭",
    itemCount: 8, showItemCount: true,
    children: [
      node({ slug: "ongc", label: "ONGC", pillar: "government-jobs", path: "government-jobs/psu-jobs/ongc", depth: 2 }),
      node({ slug: "bhel", label: "BHEL", pillar: "government-jobs", path: "government-jobs/psu-jobs/bhel", depth: 2 }),
      node({ slug: "ntpc", label: "NTPC", pillar: "government-jobs", path: "government-jobs/psu-jobs/ntpc", depth: 2 }),
      node({ slug: "iocl", label: "IOCL", pillar: "government-jobs", path: "government-jobs/psu-jobs/iocl", depth: 2 }),
    ],
  }),
  node({
    slug: "qualification-wise", label: "Qualification Wise", pillar: "government-jobs",
    path: "government-jobs/qualification-wise", depth: 1, icon: "🎓",
    itemCount: 5, showItemCount: true,
    children: [
      node({ slug: "10th-pass", label: "10th Pass Jobs", pillar: "government-jobs", path: "government-jobs/qualification-wise/10th-pass", depth: 2 }),
      node({ slug: "12th-pass", label: "12th Pass Jobs", pillar: "government-jobs", path: "government-jobs/qualification-wise/12th-pass", depth: 2 }),
      node({ slug: "graduate-jobs", label: "Graduate Jobs", pillar: "government-jobs", path: "government-jobs/qualification-wise/graduate-jobs", depth: 2 }),
      node({ slug: "post-graduate-jobs", label: "Post Graduate Jobs", pillar: "government-jobs", path: "government-jobs/qualification-wise/post-graduate-jobs", depth: 2 }),
      node({ slug: "engineering-jobs", label: "Engineering Jobs", pillar: "government-jobs", path: "government-jobs/qualification-wise/engineering-jobs", depth: 2 }),
    ],
  }),
  node({
    slug: "latest-bharti", label: "Latest Bharti", pillar: "government-jobs",
    path: "government-jobs/latest-bharti", depth: 1, icon: "🆕", badge: "new",
    itemCount: 10, showItemCount: true,
    children: [
      node({ slug: "anganwadi-bharti", label: "Anganwadi Bharti", pillar: "government-jobs", path: "government-jobs/latest-bharti/anganwadi-bharti", depth: 2 }),
      node({ slug: "panchayat-bharti", label: "Panchayat Bharti", pillar: "government-jobs", path: "government-jobs/latest-bharti/panchayat-bharti", depth: 2 }),
      node({ slug: "hospital-bharti", label: "Hospital Bharti", pillar: "government-jobs", path: "government-jobs/latest-bharti/hospital-bharti", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// ENTRANCE EXAMS
// ═══════════════════════════════════════════════════════════════════

const entranceExamCategories: TaxonomyNode[] = [
  node({
    slug: "engineering", label: "Engineering", pillar: "entrance-exam",
    path: "entrance-exam/engineering", depth: 1, icon: "⚙️", isPinned: true,
    itemCount: 8, showItemCount: true,
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
    itemCount: 5, showItemCount: true,
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
    itemCount: 6, showItemCount: true,
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
    itemCount: 4, showItemCount: true,
    children: [
      node({ slug: "clat", label: "CLAT", pillar: "entrance-exam", path: "entrance-exam/law/clat", depth: 2, badge: "popular" }),
      node({ slug: "ailet", label: "AILET", pillar: "entrance-exam", path: "entrance-exam/law/ailet", depth: 2 }),
      node({ slug: "lsat", label: "LSAT India", pillar: "entrance-exam", path: "entrance-exam/law/lsat", depth: 2 }),
    ],
  }),
  node({
    slug: "agriculture", label: "Agriculture", pillar: "entrance-exam",
    path: "entrance-exam/agriculture", depth: 1, icon: "🌾",
    itemCount: 3, showItemCount: true,
    children: [
      node({ slug: "icar-aieea", label: "ICAR AIEEA", pillar: "entrance-exam", path: "entrance-exam/agriculture/icar-aieea", depth: 2 }),
      node({ slug: "bhu-uet", label: "BHU UET", pillar: "entrance-exam", path: "entrance-exam/agriculture/bhu-uet", depth: 2 }),
    ],
  }),
  node({
    slug: "design", label: "Design", pillar: "entrance-exam",
    path: "entrance-exam/design", depth: 1, icon: "🎨",
    itemCount: 3, showItemCount: true,
    children: [
      node({ slug: "nid-dat", label: "NID DAT", pillar: "entrance-exam", path: "entrance-exam/design/nid-dat", depth: 2 }),
      node({ slug: "uceed", label: "UCEED", pillar: "entrance-exam", path: "entrance-exam/design/uceed", depth: 2 }),
      node({ slug: "nift", label: "NIFT", pillar: "entrance-exam", path: "entrance-exam/design/nift", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// UNIVERSITY EXAMS
// ═══════════════════════════════════════════════════════════════════

const universityCategories: TaxonomyNode[] = [
  node({
    slug: "ignou", label: "IGNOU", pillar: "university-exam",
    path: "university-exam/ignou", depth: 1, icon: "🏫", isPinned: true,
    itemCount: 8, showItemCount: true,
    children: [
      node({ slug: "ignou-result", label: "IGNOU Result", pillar: "university-exam", path: "university-exam/ignou/ignou-result", depth: 2, badge: "trending" }),
      node({ slug: "ignou-admission", label: "IGNOU Admission", pillar: "university-exam", path: "university-exam/ignou/ignou-admission", depth: 2 }),
      node({ slug: "ignou-assignment", label: "IGNOU Assignment", pillar: "university-exam", path: "university-exam/ignou/ignou-assignment", depth: 2 }),
      node({ slug: "ignou-date-sheet", label: "IGNOU Date Sheet", pillar: "university-exam", path: "university-exam/ignou/ignou-date-sheet", depth: 2 }),
    ],
  }),
  node({
    slug: "du", label: "Delhi University", pillar: "university-exam",
    path: "university-exam/du", depth: 1, icon: "🎓",
    itemCount: 5, showItemCount: true,
    children: [
      node({ slug: "du-admission", label: "DU Admission", pillar: "university-exam", path: "university-exam/du/du-admission", depth: 2 }),
      node({ slug: "du-result", label: "DU Result", pillar: "university-exam", path: "university-exam/du/du-result", depth: 2 }),
      node({ slug: "du-date-sheet", label: "DU Date Sheet", pillar: "university-exam", path: "university-exam/du/du-date-sheet", depth: 2 }),
    ],
  }),
  node({
    slug: "bhu", label: "BHU", pillar: "university-exam",
    path: "university-exam/bhu", depth: 1, icon: "🕉️",
    itemCount: 4, showItemCount: true,
    children: [
      node({ slug: "bhu-admission", label: "BHU Admission", pillar: "university-exam", path: "university-exam/bhu/bhu-admission", depth: 2 }),
      node({ slug: "bhu-result", label: "BHU Result", pillar: "university-exam", path: "university-exam/bhu/bhu-result", depth: 2 }),
    ],
  }),
  node({
    slug: "mjpru", label: "MJPRU", pillar: "university-exam",
    path: "university-exam/mjpru", depth: 1, icon: "📖",
    itemCount: 4, showItemCount: true,
    children: [
      node({ slug: "mjpru-result", label: "MJPRU Result", pillar: "university-exam", path: "university-exam/mjpru/mjpru-result", depth: 2 }),
      node({ slug: "mjpru-date-sheet", label: "MJPRU Date Sheet", pillar: "university-exam", path: "university-exam/mjpru/mjpru-date-sheet", depth: 2 }),
      node({ slug: "mjpru-admission", label: "MJPRU Admission", pillar: "university-exam", path: "university-exam/mjpru/mjpru-admission", depth: 2 }),
    ],
  }),
  node({
    slug: "other-universities", label: "Other Universities", pillar: "university-exam",
    path: "university-exam/other-universities", depth: 1, icon: "🏛️",
    itemCount: 6, showItemCount: true,
    children: [
      node({ slug: "amu", label: "AMU", pillar: "university-exam", path: "university-exam/other-universities/amu", depth: 2 }),
      node({ slug: "jnu", label: "JNU", pillar: "university-exam", path: "university-exam/other-universities/jnu", depth: 2 }),
      node({ slug: "lucknow-university", label: "Lucknow University", pillar: "university-exam", path: "university-exam/other-universities/lucknow-university", depth: 2 }),
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
    itemCount: 6, showItemCount: true,
    children: [
      node({ slug: "cbse-10th-result", label: "CBSE 10th Result", pillar: "board-exam", path: "board-exam/cbse/cbse-10th-result", depth: 2, badge: "trending" }),
      node({ slug: "cbse-12th-result", label: "CBSE 12th Result", pillar: "board-exam", path: "board-exam/cbse/cbse-12th-result", depth: 2, badge: "trending" }),
      node({ slug: "cbse-date-sheet", label: "CBSE Date Sheet", pillar: "board-exam", path: "board-exam/cbse/cbse-date-sheet", depth: 2 }),
      node({ slug: "cbse-syllabus", label: "CBSE Syllabus", pillar: "board-exam", path: "board-exam/cbse/cbse-syllabus", depth: 2 }),
    ],
  }),
  node({
    slug: "up-board", label: "UP Board", pillar: "board-exam",
    path: "board-exam/up-board", depth: 1, icon: "📗", isPinned: true,
    itemCount: 5, showItemCount: true,
    children: [
      node({ slug: "up-board-10th-result", label: "UP Board 10th Result", pillar: "board-exam", path: "board-exam/up-board/up-board-10th-result", depth: 2, badge: "popular" }),
      node({ slug: "up-board-12th-result", label: "UP Board 12th Result", pillar: "board-exam", path: "board-exam/up-board/up-board-12th-result", depth: 2, badge: "popular" }),
      node({ slug: "up-board-date-sheet", label: "UP Board Date Sheet", pillar: "board-exam", path: "board-exam/up-board/up-board-date-sheet", depth: 2 }),
    ],
  }),
  node({
    slug: "bihar-board", label: "Bihar Board", pillar: "board-exam",
    path: "board-exam/bihar-board", depth: 1, icon: "📕",
    itemCount: 4, showItemCount: true,
    children: [
      node({ slug: "bseb-10th-result", label: "BSEB 10th Result", pillar: "board-exam", path: "board-exam/bihar-board/bseb-10th-result", depth: 2 }),
      node({ slug: "bseb-12th-result", label: "BSEB 12th Result", pillar: "board-exam", path: "board-exam/bihar-board/bseb-12th-result", depth: 2 }),
    ],
  }),
  node({
    slug: "mp-board", label: "MP Board", pillar: "board-exam",
    path: "board-exam/mp-board", depth: 1, icon: "📙",
    itemCount: 3, showItemCount: true,
    children: [
      node({ slug: "mp-board-10th-result", label: "MP Board 10th Result", pillar: "board-exam", path: "board-exam/mp-board/mp-board-10th-result", depth: 2 }),
      node({ slug: "mp-board-12th-result", label: "MP Board 12th Result", pillar: "board-exam", path: "board-exam/mp-board/mp-board-12th-result", depth: 2 }),
    ],
  }),
  node({
    slug: "haryana-board", label: "Haryana Board (BSEH)", pillar: "board-exam",
    path: "board-exam/haryana-board", depth: 1, icon: "📒",
    itemCount: 3, showItemCount: true,
    children: [
      node({ slug: "bseh-10th-result", label: "BSEH 10th Result", pillar: "board-exam", path: "board-exam/haryana-board/bseh-10th-result", depth: 2 }),
      node({ slug: "bseh-12th-result", label: "BSEH 12th Result", pillar: "board-exam", path: "board-exam/haryana-board/bseh-12th-result", depth: 2 }),
    ],
  }),
  node({
    slug: "rajasthan-board", label: "Rajasthan Board (RBSE)", pillar: "board-exam",
    path: "board-exam/rajasthan-board", depth: 1, icon: "📓",
    itemCount: 3, showItemCount: true,
    children: [
      node({ slug: "rbse-10th-result", label: "RBSE 10th Result", pillar: "board-exam", path: "board-exam/rajasthan-board/rbse-10th-result", depth: 2 }),
      node({ slug: "rbse-12th-result", label: "RBSE 12th Result", pillar: "board-exam", path: "board-exam/rajasthan-board/rbse-12th-result", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════════

const newsCategories: TaxonomyNode[] = [
  node({
    slug: "sarkari-result", label: "Sarkari Result", pillar: "news",
    path: "news/sarkari-result", depth: 1, icon: "📋", isPinned: true, badge: "trending",
    itemCount: 10, showItemCount: true,
    children: [
      node({ slug: "latest-results", label: "Latest Results", pillar: "news", path: "news/sarkari-result/latest-results", depth: 2 }),
      node({ slug: "merit-list", label: "Merit List", pillar: "news", path: "news/sarkari-result/merit-list", depth: 2 }),
      node({ slug: "cut-off", label: "Cut Off", pillar: "news", path: "news/sarkari-result/cut-off", depth: 2 }),
    ],
  }),
  node({
    slug: "admit-card", label: "Admit Card", pillar: "news",
    path: "news/admit-card", depth: 1, icon: "🎫", isPinned: true,
    itemCount: 8, showItemCount: true,
    children: [
      node({ slug: "latest-admit-cards", label: "Latest Admit Cards", pillar: "news", path: "news/admit-card/latest-admit-cards", depth: 2 }),
      node({ slug: "hall-ticket", label: "Hall Ticket", pillar: "news", path: "news/admit-card/hall-ticket", depth: 2 }),
    ],
  }),
  node({
    slug: "answer-key", label: "Answer Key", pillar: "news",
    path: "news/answer-key", depth: 1, icon: "🔑",
    itemCount: 5, showItemCount: true,
    children: [
      node({ slug: "latest-answer-keys", label: "Latest Answer Keys", pillar: "news", path: "news/answer-key/latest-answer-keys", depth: 2 }),
      node({ slug: "objection-tracker", label: "Objection Tracker", pillar: "news", path: "news/answer-key/objection-tracker", depth: 2 }),
    ],
  }),
  node({
    slug: "syllabus", label: "Syllabus", pillar: "news",
    path: "news/syllabus", depth: 1, icon: "📑",
    itemCount: 6, showItemCount: true,
    children: [
      node({ slug: "exam-pattern", label: "Exam Pattern", pillar: "news", path: "news/syllabus/exam-pattern", depth: 2 }),
      node({ slug: "latest-syllabus", label: "Latest Syllabus", pillar: "news", path: "news/syllabus/latest-syllabus", depth: 2 }),
    ],
  }),
  node({
    slug: "education-news", label: "Education News", pillar: "news",
    path: "news/education-news", depth: 1, icon: "📰",
    itemCount: 10, showItemCount: true,
    children: [
      node({ slug: "policy-updates", label: "Policy Updates", pillar: "news", path: "news/education-news/policy-updates", depth: 2 }),
      node({ slug: "exam-schedule", label: "Exam Schedule", pillar: "news", path: "news/education-news/exam-schedule", depth: 2 }),
      node({ slug: "scholarship", label: "Scholarship", pillar: "news", path: "news/education-news/scholarship", depth: 2 }),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════
// ASSEMBLED NAVIGATION TREES
// ═══════════════════════════════════════════════════════════════════

export const STATIC_NAVIGATION_TREES: NavigationTree[] = [
  {
    pillar: "government-exam",
    label: "Govt Exams",
    href: "/government-exam",
    icon: "🏛️",
    nodes: govtExamCategories,
    totalItemCount: 60,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "government-jobs",
    label: "Govt Jobs",
    href: "/government-jobs",
    icon: "💼",
    nodes: govtJobCategories,
    totalItemCount: 301,
    lastUpdated: "2026-07-31T00:00:00Z",
  },
  {
    pillar: "entrance-exam",
    label: "Entrance Exams",
    href: "/entrance-exam",
    icon: "🎓",
    nodes: entranceExamCategories,
    totalItemCount: 123,
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
    pillar: "board-exam",
    label: "Board Exams",
    href: "/board-exam",
    icon: "📘",
    nodes: boardExamCategories,
    totalItemCount: 76,
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
  { id: "qa-3", label: "SSC CGL", href: "/government-exam/ssc/ssc-cgl", icon: "🏛️" },
  { id: "qa-4", label: "UPSC", href: "/government-exam/upsc/upsc-cse", icon: "⭐" },
  { id: "qa-5", label: "IBPS PO", href: "/government-exam/banking/ibps-po", icon: "🏦" },
  { id: "qa-6", label: "CAT", href: "/entrance-exam/mba/cat", icon: "💼" },
  { id: "qa-7", label: "UP Board Result", href: "/board-exam/up-board/up-board-12th-result", icon: "📗" },
  { id: "qa-8", label: "CBSE Date Sheet", href: "/board-exam/cbse/cbse-date-sheet", icon: "📘" },
];
