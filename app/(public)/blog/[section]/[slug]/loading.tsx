export default function BlogArticleLoading() {
  return (
    <div className="container mx-auto px-4 py-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded w-4/5" />
          <div className="h-5 bg-gray-100 rounded w-3/4" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-52 bg-gray-100 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
