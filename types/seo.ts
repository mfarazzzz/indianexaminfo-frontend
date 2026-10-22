import type { ContentType, Pillar } from "./exam";
import type { BlogSection, PostType } from "./blog";

export type PageType =
  | "homepage"
  | "pillar"
  | "category"
  | "exam-entity"
  | "content-type"
  | "blog-homepage"
  | "blog-section"
  | "blog-post"
  | "board"
  | "university"
  | "static"
  | "search"
  | "hub";

export type BuildMetadataProps = {
  pageType: PageType;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogAlt?: string;
  pillar?: Pillar;
  contentType?: ContentType;
  section?: BlogSection;
  postType?: PostType;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  noIndex?: boolean;
  /** The record's slug. When it is a reference TEST slug (lib/testContent) the
   *  page is forced noindex/nofollow regardless of noIndex — a test page must be
   *  reachable by direct URL but never indexed. Optional; static hub pages omit
   *  it and are unaffected. */
  slug?: string;
};
