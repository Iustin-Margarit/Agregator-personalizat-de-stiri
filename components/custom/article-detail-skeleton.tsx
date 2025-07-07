export default function ArticleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation Skeleton */}
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Article Header Skeleton */}
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Hero Image Skeleton */}
          <div className="w-full h-64 md:h-96 bg-gray-200 animate-pulse"></div>

          <div className="p-6 md:p-8">
            {/* Category Badge Skeleton */}
            <div className="mb-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Article Title Skeleton */}
            <div className="mb-4 space-y-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Article Meta Information Skeleton */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Article Interactions Skeleton */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Article Content Skeleton */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-4 mb-8">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Read Full Article Link Skeleton */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
                <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section Skeleton */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <div className="mb-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Article Image Skeleton */}
                  <div className="aspect-video w-full bg-gray-200 animate-pulse"></div>
                  
                  <div className="p-4">
                    {/* Category Badge Skeleton */}
                    <div className="mb-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Article Title Skeleton */}
                    <div className="mb-2 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Article Summary Skeleton */}
                    <div className="mb-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Article Meta Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Link Skeleton */}
            <div className="mt-8 text-center">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}