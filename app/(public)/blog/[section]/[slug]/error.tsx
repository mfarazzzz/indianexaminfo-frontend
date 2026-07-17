"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Blog Post Error]", error.message, error.digest);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 text-sm mb-2">
        We encountered an issue loading this article.
      </p>
      <p className="text-xs text-red-500 bg-red-50 rounded p-2 mb-6 font-mono break-all">
        {error.message || "Unknown error"} {error.digest ? `(${error.digest})` : ""}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
        <Link href="/blog" className="text-primary text-sm hover:underline">
          ← Back to Blog
        </Link>
      </div>
    </div>
  );
}
