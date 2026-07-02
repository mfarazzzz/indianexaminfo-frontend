import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostsByAuthor } from "@/services/blogService";
import { authors } from "@/data/authors";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { Twitter, Linkedin, Clock } from "lucide-react";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) return {};
  return buildExamMetadata({
    pageType: "static",
    title: `${author.name} — ${author.designation} | IndianExamInfo`,
    description: `Articles by ${author.name}, ${author.designation}. ${author.bio.slice(0, 120)}`,
    keywords: [...author.specialization.map(s => s.toLowerCase()), ...GLOBAL_SHORT_TAIL.slice(0, 4)],
    canonicalUrl: `${siteConfig.url}/blog/author/${slug}`,
  });
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) notFound();

  const posts = await getBlogPostsByAuthor(slug);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={[
          { name: "Blog & News", href: "/blog" },
          { name: author.name, href: `/blog/author/${slug}` },
        ]} />

        {/* Author header */}
        <div className="bg-card border border-border rounded p-6 mt-4 mb-6 flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0">
            {author.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-2xl text-gray-900">{author.name}</h1>
            <p className="text-gray-500 mb-2">{author.designation}</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-3 max-w-2xl">{author.bio}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {author.specialization.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{author.totalPosts} articles</span>
              {author.socialLinks.twitter && (
                <a href={author.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Twitter className="w-3.5 h-3.5" /> Twitter
                </a>
              )}
              {author.socialLinks.linkedin && (
                <a href={author.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
          Articles by {author.name} ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No published articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-card border border-border rounded shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-300 text-xs shrink-0">Image</div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <span className="text-xs text-editorial font-semibold uppercase">{post.section.replace(/-/g, " ")}</span>
                  <h3 className="font-heading font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                    <Link href={`/blog/${post.section}/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                    <Clock className="w-3 h-3" />
                    <span>{post.readingTime} min</span>
                    <span>·</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
