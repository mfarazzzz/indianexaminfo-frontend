export type BlogSection =
  | "education-news"
  | "exam-prep"
  | "career-guidance"
  | "scholarship"
  | "study-abroad"
  | "edtech"
  | "student-life"
  | "opinion";

export type PostType =
  | "news"
  | "article"
  | "guide"
  | "listicle"
  | "opinion"
  | "interview"
  | "analysis"
  | "how-to";

export type BlogAuthor = {
  id: string;
  slug: string;
  name: string;
  designation: string;
  avatar: string;
  bio: string;
  totalPosts: number;
  specialization: string[];
  socialLinks: { twitter?: string; linkedin?: string };
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  section: BlogSection;
  postType: PostType;
  author: BlogAuthor;
  featuredImage: string;
  featuredImageCaption: string;
  readingTime: number;
  wordCount: number;
  views: number;
  shares: number;
  tags: string[];
  relatedExamSlugs: string[];
  publishedAt: string;
  updatedAt: string;
  status: "draft" | "published";
  isFeatured: boolean;
  isBreaking: boolean;
  isPinned: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  tableOfContents: {
    id: string;
    title: string;
    level: 2 | 3;
  }[];
  faqs?: { question: string; answer: string }[];
};
