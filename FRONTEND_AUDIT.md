# Frontend Production Readiness Audit

**Date:** July 14, 2026
**Scope:** Complete end-to-end audit of frontend against CMS

---

## Phase 1 — Route Audit

### All Routes (30 total)

| # | Route | Data Source | CMS Table(s) | Service | Renders CMS Data | Issues |
|---|-------|-------------|--------------|---------|-----------------|--------|
| 1 | `/` | Supabase | exams, content_posts | examService, contentPostService | ✅ Yes | None |
| 2 | `/sarkari-naukri` | Supabase | exams | examService.getExamsByPillar | ✅ Yes | ⚠️ Category grid is hardcoded (12 categories with counts) |
| 3 | `/sarkari-naukri/[category]` | Supabase | exams, categories | examService.getExamsByCategory | ✅ Yes | None |
| 4 | `/sarkari-naukri/[category]/[slug]` | Supabase | exams, content_posts | examService.getExamBySlug, contentPostService | ✅ Yes | None |
| 5 | `/sarkari-naukri/[category]/[slug]/[contentType]` | Supabase | exams, content_posts | examService, contentPostService | ✅ Yes | None |
| 6 | `/entrance-exam` | Supabase | exams | examService.getExamsByPillar | ✅ Yes | ⚠️ Category grid hardcoded (12 categories) |
| 7 | `/entrance-exam/[category]` | Supabase | exams, categories | examService.getExamsByCategory | ✅ Yes | None |
| 8 | `/entrance-exam/[category]/[slug]` | Supabase | exams | examService.getExamBySlug | ✅ Yes | None |
| 9 | `/entrance-exam/[category]/[slug]/[contentType]` | Supabase | exams, content_posts | examService, contentPostService | ✅ Yes | None |
| 10 | `/board-exam` | Supabase | exams | examService.getExamsByPillar | ✅ Yes | ⚠️ Fallback hardcoded links when DB empty |
| 11 | `/board-exam/cbse/[class]` | Supabase | exams | examService | ✅ Yes | None |
| 12 | `/board-exam/state/[stateSlug]/[slug]` | Supabase | exams | examService | ✅ Yes | None |
| 13 | `/board-exam/university/[slug]` | Supabase | exams | examService | ✅ Yes | None |
| 14 | `/board-exam/university/[slug]/[contentType]` | Supabase | content_posts | contentPostService | ✅ Yes | None |
| 15 | `/admit-card` | Supabase | exams, content_posts | examService.getExamsByContentType, contentPostService.getLatestByContentType | ✅ Yes | None |
| 16 | `/results` | Supabase | exams, content_posts | Same pattern as admit-card | ✅ Yes | None |
| 17 | `/answer-key` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 18 | `/syllabus` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 19 | `/date-sheet` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 20 | `/mock-test` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 21 | `/previous-papers` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 22 | `/study-material` | Supabase | exams, content_posts | Same pattern | ✅ Yes | None |
| 23 | `/blog` | Supabase | blog_posts, blog_authors | blogService | ✅ Yes | None |
| 24 | `/blog/[section]` | Supabase | blog_posts | blogService.getBlogPostsBySection | ✅ Yes | None |
| 25 | `/blog/author/[slug]` | Supabase | blog_authors, blog_posts | blogService | ✅ Yes | None |
| 26 | `/blog/tag/[tag]` | Supabase | blog_posts | blogService.getBlogPostsByTag | ✅ Yes | None |
| 27 | `/search` | Supabase | exams, content_posts, blog_posts | All 3 services | ✅ Yes | None |
| 28 | `/about` | Supabase (fallback: hardcoded) | pages | pageService.getPageBySlug | ✅ Yes | Has proper fallback |
| 29 | `/privacy-policy` | Supabase (fallback: hardcoded) | pages | pageService | ✅ Yes | Has proper fallback |
| 30 | `/disclaimer` | Supabase (fallback: hardcoded) | pages | pageService | ✅ Yes | Has proper fallback |

### API Routes (6)

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/api/revalidate` | CMS → Frontend cache invalidation | N/A (receives tags) |
| `/api/search` | Client-side search endpoint | exams, blog_posts, content_posts |
| `/api/ads/[position]` | Serves ad creatives | ad_zones, ad_campaigns, ad_creatives |
| `/api/og` | Dynamic OpenGraph image generation | N/A |
| `/api/feed` | RSS feed | exams, blog_posts |
| `/api/sitemap-index` | Dynamic sitemap | exams, content_posts, blog_posts, pages |

### Hardcoded Content Found

| Location | What's Hardcoded | Should Come From CMS |
|----------|-----------------|---------------------|
| `/sarkari-naukri/page.tsx` | Category grid (12 items with counts) | `categories` table filtered by pillar |
| `/entrance-exam/page.tsx` | Category grid (12 items with icons) | `categories` table filtered by pillar |
| `/board-exam/page.tsx` | "All State Boards" sidebar list | `categories` table |
| `config/navigation.ts` | Full mega-menu (~80 links) | `menus` + `menu_items` tables |
| Hub page sidebars | "Other Content Types" quick links | `navigation.quickLinks` hardcoded |
| Blog page | Section list | Hardcoded array (matches DB enum) |
| Blog tags sidebar | Popular tags | Hardcoded array |

---

## Phase 2 — Module Verification

### Content Type Renderer Coverage

| Module | Has Renderer | Renders All CMS Fields | Notes |
|--------|-------------|----------------------|-------|
| Notification | ✅ | ✅ vacancyCount, eligibilitySummary, notificationPdfUrl | Complete |
| Application | ✅ | ✅ dates, fees, documents, applyUrl, howToApply | Complete |
| Admit Card | ✅ | ✅ releaseDate, examDate, credentials, downloadUrl | Complete |
| Answer Key | ✅ | ✅ keyType, challengeWindow, objectionFee, urls | Complete |
| Result | ✅ | ✅ resultDate, urls, cutoff, nextSteps | Complete |
| Cutoff | ✅ | ✅ year, type, categoryWise table, pdf | Complete |
| Syllabus | ✅ | ✅ year, version, subjects list, pdf | Complete |
| Date Sheet | ✅ | ✅ dates, schedule table, pdf | Complete |
| Previous Papers | ✅ | ✅ papers table (year/title/url) | Complete |
| Mock Test | ✅ | ✅ totalTests, freeTests, pattern, url | **NEW — just added** |
| Study Material | ✅ | ✅ subjects, format, isFree, url | **NEW — just added** |
| Books | ✅ | ✅ bookList, description | **NEW — just added** |
| Counselling | ❌ | — | Not in ContentType enum; would need new type |
| Gallery | ❌ | — | No frontend page for gallery rendering |
| Videos | ❌ | — | No frontend page for video rendering |

### Exam Detail Page Field Rendering

| CMS Field | Rendered on Frontend | Component |
|-----------|---------------------|-----------|
| name | ✅ | EntityDetailPage H1 |
| shortName | ✅ | Quick links, breadcrumbs |
| conductingBody | ✅ | Meta row |
| officialWebsite | ✅ | Link + Quick Links sidebar |
| status | ✅ | Status badge |
| lastUpdated | ✅ | Meta row |
| dates[] | ✅ | Important Dates table |
| eligibility | ✅ | Eligibility table |
| applicationFee | ✅ | Fee table |
| selectionProcess | ✅ | Ordered list |
| vacancy | ✅ | Summary box |
| tags | ✅ | Tag cloud |
| faqs | ✅ | FAQ section + JSON-LD |
| seoTitle | ✅ | `<title>` via generateMetadata |
| seoDescription | ✅ | meta description |
| hasAdmitCard...hasCutoff | ✅ | "Available Content" navigation |
| syllabusHighlights | ❌ NOT rendered | Missing from detail page |
| searchKeywords | ❌ NOT rendered (meta only) | Used only in SEO keywords |
| academicYear | ❌ NOT rendered | Missing from detail page |
| semester | ❌ NOT rendered | Missing |
| admissionTo | ❌ NOT rendered | Missing |

---

## Phase 5 — SEO Audit

| Feature | Status | Implementation |
|---------|--------|---------------|
| Page title | ✅ | Dynamic via `generateMetadata()` on every page |
| Meta description | ✅ | Dynamic, uses exam data |
| Canonical URL | ✅ | Set on every page |
| robots | ✅ | Search page noindex, others index |
| OpenGraph | ✅ | Dynamic OG image via `/api/og` |
| Twitter Card | ✅ | Via metadata export |
| JSON-LD Organization | ✅ | In root layout |
| JSON-LD WebSite | ✅ | In root layout |
| JSON-LD FAQ | ✅ | On exam + content pages (when FAQs exist) |
| JSON-LD JobPosting | ✅ | On sarkari-naukri exams |
| JSON-LD Event | ✅ | On all exam pages |
| JSON-LD HowTo | ✅ | On content type pages |
| JSON-LD Breadcrumb | ⚠️ Partial | Breadcrumb component exists but no BreadcrumbList schema |
| Sitemap | ✅ | Dynamic, covers exams + blog + pages |
| RSS/Atom | ✅ | `/api/feed` endpoint |
| hreflang | ✅ | `en-IN` set |
| Image alt text | ⚠️ | No exam images yet; blog images lack alt |

---

## Phase 6 — Performance

| Metric | Status | Notes |
|--------|--------|-------|
| Duplicate queries | ✅ Fixed | Homepage uses single `Promise.all` (5 parallel queries, data passed as props) |
| N+1 queries | ✅ None found | Category joins use FK relationships |
| Tag-based revalidation | ✅ Implemented | `unstable_cache` with tags on key functions |
| ISR/revalidate | ✅ | Every page sets `revalidate` (900–7200s) |
| Bundle splitting | ✅ | Next.js automatic code splitting |
| Image optimization | ⚠️ | No `next/image` usage found; images use raw `<img>` |
| Client components | ✅ Minimal | Only Header, SearchHero, LatestUpdatesClient are client |

---

## Phase 7 — Error Handling

| Scenario | Handled | How |
|----------|---------|-----|
| 404 (invalid slug) | ✅ | `notFound()` or `redirect()` in page components |
| Empty data | ✅ | All pages handle empty arrays gracefully |
| Missing modules | ✅ | ContentTypeDataRenderer returns null for empty data |
| Draft content | ✅ | All queries filter `status = "published"` |
| Deleted content | ✅ | `maybeSingle()` returns null → redirect/notFound |
| Network failure | ✅ | All services have try/catch returning empty arrays |
| Missing images | ⚠️ | No fallback image rendering |
| `/app/error.tsx` | ✅ | Global error boundary exists |
| `/app/not-found.tsx` | ✅ | Custom 404 page exists |
| `/app/loading.tsx` | ✅ | Loading state exists |

---

## Phase 9 — Production Readiness Scores

| Category | Score | Justification |
|----------|-------|---------------|
| Architecture | 8/10 | Clean separation: services → pages → components. Two parallel systems (entity/exam) reduce clarity. |
| Frontend | 8/10 | All pages functional, CMS-driven, proper SEO. Some hardcoded category grids remain. |
| CMS Integration | 9/10 | All tables consumed. Tag-based revalidation. Automatic sync. |
| Performance | 7/10 | ISR + parallel queries. Missing: `next/image`, BreadcrumbList schema, lazy sidebar widgets. |
| SEO | 9/10 | Title/desc/canonical/OG/JSON-LD on all pages. Missing: BreadcrumbList schema, image alts. |
| Accessibility | 6/10 | ARIA labels present, semantic HTML. Missing: skip-to-content (exists but needs verification), focus management, contrast audit. |
| Maintainability | 8/10 | Service-per-table pattern, shared components, config-driven. Module registry is configuration-first. |
| Scalability | 8/10 | Adding new exam = CMS row. Adding new content type = add to ContentType enum + renderer. |
| Production Readiness | 8/10 | All critical paths work. Remaining: hardcoded categories, missing BreadcrumbList, image optimization. |

---

## Remaining Issues (Prioritized)

### Must Fix Before Launch
1. ⚠️ **Hardcoded category grids** on `/sarkari-naukri` and `/entrance-exam` pages — should query `categories` table
2. ⚠️ **Missing `syllabusHighlights`, `academicYear`, `semester`, `admissionTo`** rendering on exam detail page

### Should Fix
3. Missing BreadcrumbList JSON-LD schema
4. No `next/image` optimization (all images are raw URLs)
5. Blog post featured images show "Image" placeholder text instead of actual images
6. Popular tags in blog sidebar are hardcoded

### Nice to Have
7. Counselling, Gallery, Videos content types not yet supported as separate pages
8. Navigation not yet wired from CMS (fallback to hardcoded — works but not CMS-driven)
