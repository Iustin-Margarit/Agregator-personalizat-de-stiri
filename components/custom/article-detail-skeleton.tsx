export default function ArticleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation Skeleton */}
        <div className="mb-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Article Header Skeleton */}
        <article className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          {/* Hero Image Skeleton */}
          <div className="w-full h-64 md:h-96 bg-muted animate-pulse"></div>

          <div className="p-6 md:p-8">
            {/* Category Badge Skeleton */}
            <div className="mb-4">
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div>
            </div>

            {/* Article Title Skeleton */}
            <div className="mb-4 space-y-3">
              <div className="h-8 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Article Meta Information Skeleton */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-28 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Article Interactions Skeleton */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>

            {/* Article Content Skeleton */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="space-y-4 mb-8">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-4/5 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
              </div>
              
              {/* Read Full Article Link Skeleton */}
              <div className="bg-muted rounded-lg p-6 text-center border border-border">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse mx-auto mb-4"></div>
                <div className="h-12 w-48 bg-muted rounded-lg animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section Skeleton */}
        <div className="mt-12">
          <div className="bg-card rounded-lg shadow-sm p-6 md:p-8 border border-border">
            <div className="mb-6">
              <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden bg-card">
                  {/* Article Image Skeleton */}
                  <div className="aspect-video w-full bg-muted animate-pulse"></div>
                  
                  <div className="p-4">
                    {/* Category Badge Skeleton */}
                    <div className="mb-2">
                      <div className="h-5 w-16 bg-muted rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Article Title Skeleton */}
                    <div className="mb-2 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 w-4/5 bg-muted rounded animate-pulse"></div>
                    </div>
                    
                    {/* Article Summary Skeleton */}
                    <div className="mb-3 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
                    </div>
                    
                    {/* Article Meta Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Link Skeleton */}
            <div className="mt-8 text-center">
              <div className="h-10 w-40 bg-muted rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}