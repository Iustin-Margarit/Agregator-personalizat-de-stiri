export default function ArticleCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 flex flex-col animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 rounded-md mb-4" />
      
      {/* Category badge skeleton */}
      <div className="w-20 h-5 bg-gray-200 rounded-full mb-2" />
      
      {/* Title skeleton */}
      <div className="space-y-2 mb-2">
        <div className="h-6 bg-gray-200 rounded w-full" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
      </div>
      
      {/* Source and date skeleton */}
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
      
      {/* Summary skeleton */}
      <div className="space-y-2 flex-grow mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      
      {/* Bottom section skeleton */}
      <div className="flex items-center justify-between mt-auto">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="w-10 h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
