export default function UniversityLoading() {
  return (
    <div className="container mx-auto px-4 py-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-28 bg-gray-100 rounded" />
          <div className="h-48 bg-gray-100 rounded" />
        </div>
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
