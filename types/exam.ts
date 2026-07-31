export type Pillar = "government-exam" | "govt-vacancy" | "entrance-exam" | "board-exam" | "university-exam" | "news";

/** Extended pillar type including legacy aliases */
export type ExtendedPillar =
  | Pillar
  | "sarkari-naukri"
  | "sarkari-bharti"
  | "board-university"
  | "government-jobs";

export type ContentType =
  | "notification"
  | "application"
  | "admit-card"
  | "date-sheet"
  | "syllabus"
  | "answer-key"
  | "result"
  | "cutoff"
  | "previous-papers"
  | "mock-test"
  | "study-material"
  | "books";

export type ExamStatus =
  | "upcoming"
  | "active"
  | "registration-open"
  | "registration-closed"
  | "result-declared"
  | "completed"
  | "ongoing";

export type ExamEntity = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  pillar: Pillar;
  category: string;
  subcategory: string;
  entityType: "exam" | "board" | "university" | "recruitment";
  conductingBody: string;
  officialWebsite: string;
  status: ExamStatus;

  // Content availability flags
  hasAdmitCard: boolean;
  hasResult: boolean;
  hasAnswerKey: boolean;
  hasSyllabus: boolean;
  hasDateSheet: boolean;
  hasMockTest: boolean;
  hasPreviousPapers: boolean;
  hasStudyMaterial: boolean;
  hasApplication: boolean;
  hasNotification: boolean;
  hasCutoff: boolean;

  dates: {
    label: string;
    date: string;
    isUrgent: boolean;
  }[];

  eligibility?: {
    age: string;
    qualification: string;
    nationality: string;
  };

  vacancy?: number;

  applicationFee?: {
    general: number;
    obc: number;
    sc: number;
    st: number;
    ews?: number;
    pwd?: number;
  };

  selectionProcess?: string[];
  syllabusHighlights?: string[];
  academicYear?: string;
  semester?: string;
  admissionTo?: string;

  tags: string[];
  lastUpdated: string;
  isFeatured: boolean;
  searchKeywords: string[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  faqs?: { question: string; answer: string }[];
};

export type ContentPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  examEntityId: string;
  examEntityName: string;
  pillar: Pillar;
  contentType: ContentType;

  quickLinks: {
    label: string;
    url: string;
    isPDF: boolean;
    isOfficial: boolean;
  }[];

  importantDates?: {
    label: string;
    date: string;
    isUrgent: boolean;
  }[];

  /** Structured per-content-type fields — keyed by field name */
  contentTypeData?: Record<string, unknown>;

  /** Attachments: PDFs, images, external URLs stored on external hosting */
  attachmentUrls?: {
    label: string;
    url: string;
    type: "pdf" | "image" | "external";
    isOfficial: boolean;
  }[];

  publishedAt: string;
  updatedAt: string;
  author?: string;
  status: "draft" | "published";
  featuredImage: string;
  tags: string[];
  isFeatured: boolean;

  seoTitle: string;
  seoDescription: string;
  faqs?: { question: string; answer: string }[];
};
