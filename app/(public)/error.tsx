"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[IndianExamInfo] Section error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">
        Unable to load this page
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        We couldn&apos;t fetch the exam data right now. This is usually temporary.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
        <Link href="/" className="text-primary text-sm hover:underline">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}
