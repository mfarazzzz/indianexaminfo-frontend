"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service when CMS is integrated
    console.error("[IndianExamInfo] Global error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <div className="text-5xl font-heading font-bold text-primary mb-4">!</div>
      <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 text-sm mb-6 leading-relaxed">
        We couldn&apos;t load this page. This might be a temporary issue.
        Please try again or return to the homepage.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-border text-gray-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && error.message && (
        <details className="mt-6 text-left">
          <summary className="text-xs text-gray-400 cursor-pointer">Error details (dev only)</summary>
          <pre className="mt-2 text-xs bg-gray-50 border border-border p-3 rounded overflow-auto text-red-600">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  );
}
