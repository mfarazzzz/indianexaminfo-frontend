import Link from "next/link";
import { getFeaturedBlogPosts } from "@/services/blogService";
import { formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";

// Section → color mapping
const sectionBorder: Record<string, string> = {
  "education-news":  "border-l-4 border-blue-500",
  "exam-prep":       "border-l-4 border-green-500",
  "career-guidance": "border-l-4 border-orange-500",
  "scholarship":     "border-l-4 border-purple-500",
  "study-abroad":    "border-l-4 border-teal-500",
  "edtech":          "border-l-4 border-pink-500",
  "student-life":    "border-l-4 border-yellow-500",
  "opinion":         "border-l-4 border-gray-400",
};

const sectionText: Record<string, string> = {
  "education-news":  "text-blue-600",
  "exam-prep":       "text-green-600",
  "career-guidance": "text-orange-600",
  "scholarship":     "text-purple-600",
  "study-abroad":    "text-teal-600",
  "edtech":          "text-pink-600",
  "student-life":    "text-yellow-600",
  "opinion":         "text-gray-500",
};

export async function EditorialSpotlight() {
  const posts = await getFeaturedBlogPosts();
  if (!posts.length) return null;

  const [featured, ...rest] = posts.slice(0, 4);

  return (
    <section aria-labelledby="editorial-spotlight-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div>
          <h2 id="editorial-spotlight-heading" className="font-heading font-bold text-lg text-gray-900">
            Blog &amp; news
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Expert guides, news and exam preparation</p>
        </div>
        <Link href="/blog" prefetch={false} className="text-xs font-semibold text-primary hover:text-primary-700 whitespace-nowrap">
          All articles
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

        {/* Featured large article */}
        <article className="bg-white border border-border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-4 flex flex-col gap-2 flex-1">
            <span className="self-start text-xs text-editorial uppercase font-bold tracking-wide">
              {featured.section.replace(/-/g, " ")}
            </span>
            <h3 className="font-heading font-bold text-sm text-gray-900 leading-snug">
              <Link href={`/blog/${featured.section}/${featured.slug}`} prefetch={false} className="hover:text-primary transition-colors">
                {featured.title}
              </Link>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 flex-1">{featured.excerpt}</p>
            <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-gray-400">
              <span className="font-medium text-gray-600">{featured.author.name}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{featured.readingTime} min</span>
              <span>{formatDate(featured.publishedAt)}</span>
            </div>
          </div>
        </article>

        {/* Three smaller articles with colored section borders */}
        <div className="flex flex-col gap-0 border border-border bg-white shadow-sm divide-y divide-border">
          {rest.slice(0, 3).map((post) => {
            const border   = sectionBorder[post.section] ?? "border-l-4 border-gray-300";
            const textCol  = sectionText[post.section]   ?? "text-gray-500";
            return (
              <div key={post.id} className={`flex gap-3 p-3 ${border} hover:bg-gray-50 transition-colors`}>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-bold uppercase tracking-wide ${textCol}`}>
                    {post.section.replace(/-/g, " ")}
                  </span>
                  <h3 className="font-heading text-xs font-bold text-gray-900 mt-0.5 leading-snug line-clamp-2">
                    <Link href={`/blog/${post.section}/${post.slug}`} prefetch={false} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{post.author.name}</span>
                    <span>·</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
