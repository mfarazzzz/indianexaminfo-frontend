import Link from "next/link";
import { getFeaturedBlogPosts } from "@/services/blogService";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

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

const featuredBg: Record<string, string> = {
  "education-news":  "from-blue-700 to-blue-900",
  "exam-prep":       "from-green-700 to-green-900",
  "career-guidance": "from-orange-600 to-orange-900",
  "scholarship":     "from-purple-700 to-purple-900",
  "study-abroad":    "from-teal-600 to-teal-900",
  "edtech":          "from-pink-600 to-pink-900",
  "student-life":    "from-yellow-600 to-yellow-800",
  "opinion":         "from-gray-600 to-gray-900",
};

export async function EditorialSpotlight() {
  const posts = await getFeaturedBlogPosts();
  if (!posts.length) return null;

  const [featured, ...rest] = posts.slice(0, 4);
  const bgGradient = featuredBg[featured.section] ?? "from-primary to-primary-800";
  const initials   = featured.title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <section aria-labelledby="editorial-spotlight-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-editorial">
        <div>
          <h2 id="editorial-spotlight-heading" className="font-heading font-bold text-base text-editorial uppercase tracking-wide">
            Blog &amp; News
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Expert guides, news &amp; exam preparation</p>
        </div>
        <Link href="/blog" className="text-xs font-semibold text-editorial hover:underline flex items-center gap-1 whitespace-nowrap">
          All Articles <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

        {/* Featured large article */}
        <article className="bg-white border border-border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          {/* Colored image placeholder */}
          <div className={`bg-gradient-to-br ${bgGradient} h-44 relative overflow-hidden flex items-center justify-center`}>
            <span className="text-white/10 text-8xl font-black select-none" aria-hidden="true">{initials}</span>
            {/* Section badge overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
              <span className="text-xs text-white bg-editorial px-2 py-0.5 rounded uppercase font-bold tracking-wide">
                {featured.section.replace(/-/g, " ")}
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-2 flex-1">
            <h3 className="font-heading font-bold text-sm text-gray-900 leading-snug">
              <Link href={`/blog/${featured.section}/${featured.slug}`} className="hover:text-primary transition-colors">
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
                    <Link href={`/blog/${post.section}/${post.slug}`} className="hover:text-primary transition-colors">
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
