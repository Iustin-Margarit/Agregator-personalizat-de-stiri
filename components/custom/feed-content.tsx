'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from '@/components/custom/article-card';
import ArticleCardSkeleton from '@/components/custom/article-card-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface FeedContentProps {
  initialArticles: any[];
  userId: string;
  preferredCategoryIds: string[];
  sourceIds: string[];
  sourcesData: any[];
}

const ARTICLES_PER_PAGE = 20;

interface FeedContentProps {
  initialArticles: any[];
  userId: string;
  preferredCategoryIds: string[];
  sourceIds: string[];
  sourcesData: any[];
}

export default function FeedContent({ 
  initialArticles, 
  userId, 
  preferredCategoryIds, 
  sourceIds, 
  sourcesData 
}: FeedContentProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length >= ARTICLES_PER_PAGE);
  const [offset, setOffset] = useState(initialArticles.length);
  
  const supabase = createClient();

  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      const { data: moreArticlesData, error } = await supabase
        .rpc('get_user_visible_articles', {
          p_user_id: userId,
          p_source_ids: sourceIds,
          p_limit: ARTICLES_PER_PAGE,
          p_offset: offset
        });

      if (error) {
        console.error('Error loading more articles:', error);
        return;
      }

      if (!moreArticlesData || moreArticlesData.length === 0) {
        setHasMore(false);
        return;
      }

      // Map articles to include category name from source data
      const moreArticlesWithCategories = moreArticlesData.map((article: any) => {
        const sourceInfo = sourcesData?.find(s => s.id === article.source_id);
        // Handle both object and array format for categories
        const categories = sourceInfo?.categories as any;
        let categoryName = 'Unknown';
        
        if (categories) {
          if (Array.isArray(categories)) {
            categoryName = categories[0]?.name || 'Unknown';
          } else {
            categoryName = categories.name || 'Unknown';
          }
        }
        
        return {
          ...article,
          category: categoryName,
          source: sourceInfo?.name || 'Unknown Source'
        };
      });

      setArticles(prev => [...prev, ...moreArticlesWithCategories]);
      setOffset(prev => prev + moreArticlesData.length);
      
      if (moreArticlesData.length < ARTICLES_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset, sourceIds, sourcesData, supabase, userId]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // Load more when 1000px from bottom
      ) {
        loadMoreArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreArticles]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Your News Feed</h1>
            <p className="text-gray-600 mt-1">Latest articles from your preferred topics</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/onboarding">Edit Topics</Link>
            </Button>
            <Button asChild>
              <Link href="/saved">Saved Articles</Link>
            </Button>
          </div>
        </div>
        
        {/* Skeleton loading grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your News Feed</h1>
          <p className="text-gray-600 mt-1">Latest articles from your preferred topics</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/onboarding">Edit Topics</Link>
          </Button>
          <Button asChild>
            <Link href="/saved">Saved Articles</Link>
          </Button>
        </div>
      </div>
      
      {articles.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No articles found for your preferred topics.</p>
          <p className="mt-2">Try selecting different topics or check back later!</p>
          <Button asChild className="mt-4">
            <Link href="/onboarding">Update Your Topics</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} userId={userId} />
          ))}
        </div>
      )}
      
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <ArticleCardSkeleton key={`loading-${index}`} />
            ))}
          </div>
        </div>
      )}
      
      {/* Load more button (backup for users who prefer manual loading) */}
      {!isLoadingMore && hasMore && articles.length > 0 && (
        <div className="text-center mt-8">
          <Button onClick={loadMoreArticles} variant="outline">
            Load More Articles
          </Button>
        </div>
      )}
      
      {/* End of articles message */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center mt-8 text-gray-500">
          <p>You've reached the end of your feed!</p>
        </div>
      )}
    </div>
  );
}
