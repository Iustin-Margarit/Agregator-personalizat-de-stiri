'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import ArticleCard from '@/components/custom/article-card';
import ArticleCardSkeleton from '@/components/custom/article-card-skeleton';
import FeedFilters from '@/components/custom/feed-filters';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Define the date filter type
type DateFilter = 'all' | 'today' | 'week' | 'month';

interface VirtualizedFeedContentProps {
  initialArticles: any[];
  userId: string;
  preferredCategoryIds: string[];
  sourceIds: string[];
  sourcesData: any[];
}

const ARTICLES_PER_PAGE = 20;
const VISIBLE_THRESHOLD = 100; // Number of articles to keep rendered

// Memoized article card to prevent unnecessary re-renders
const MemoizedArticleCard = memo(ArticleCard);

// Utility function to get date range for filtering
function getDateRange(filter: DateFilter): { start: Date | null; end: Date } {
  const now = new Date();
  const end = now;
  
  switch (filter) {
    case 'today': {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'week': {
      const start = new Date();
      start.setDate(start.getDate() - 7); // Last 7 days
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      const start = new Date();
      start.setDate(start.getDate() - 30); // Last 30 days
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'all':
    default:
      return { start: null, end };
  }
}

export default function VirtualizedFeedContent({ 
  initialArticles, 
  userId, 
  preferredCategoryIds, 
  sourceIds, 
  sourcesData 
}: VirtualizedFeedContentProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length >= ARTICLES_PER_PAGE);
  const [offset, setOffset] = useState(initialArticles.length);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(VISIBLE_THRESHOLD, initialArticles.length) });
  
  // Filter state management
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(preferredCategoryIds);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  
  // Ref for search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = createClient();

  // Function to fetch articles based on selected categories, search query, date filter, and source filter
  const fetchFilteredArticles = useCallback(async (categoryIds: string[], searchTerm = '', dateFilterValue: DateFilter = 'all', sourceIds: string[] = [], resetOffset = true) => {
    setIsFilterLoading(true);
    
    try {
      // Get source IDs for selected categories
      const { data: filteredSourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select(`
          id, 
          name, 
          category_id,
          categories (
            id,
            name
          )
        `)
        .in('category_id', categoryIds.length > 0 ? categoryIds : preferredCategoryIds);

      if (sourcesError) {
        console.error('Error fetching filtered sources:', sourcesError);
        return;
      }

      let filteredSourceIds = filteredSourcesData?.map(s => s.id) || [];
      
      // Further filter by selected sources if any are specified
      if (sourceIds.length > 0) {
        filteredSourceIds = filteredSourceIds.filter(id => sourceIds.includes(id));
      }

      if (filteredSourceIds.length === 0) {
        setArticles([]);
        setHasMore(false);
        setOffset(0);
        return;
      }

      // Use our new user-visible articles function for all queries
      // For now, we'll handle filtering in a simpler way by using the function
      // and then applying client-side filtering for search and date
      const { data: allUserArticles, error: articlesError } = await supabase
        .rpc('get_user_visible_articles', {
          p_user_id: userId,
          p_source_ids: filteredSourceIds,
          p_limit: 100, // Get more articles to allow for filtering
          p_offset: 0
        });

      if (articlesError) {
        console.error('Error fetching filtered articles:', articlesError);
        return;
      }

      let filteredArticlesData = allUserArticles || [];

      // Apply search filtering if search term is provided
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredArticlesData = filteredArticlesData.filter((article: any) =>
          article.title?.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower)
        );
      }

      // Apply date filtering if not 'all'
      if (dateFilterValue !== 'all') {
        const { start } = getDateRange(dateFilterValue);
        if (start) {
          filteredArticlesData = filteredArticlesData.filter((article: any) =>
            new Date(article.published_at) >= start
          );
        }
      }

      // Limit to requested page size
      filteredArticlesData = filteredArticlesData.slice(0, ARTICLES_PER_PAGE);

      if (articlesError) {
        console.error('Error fetching filtered articles:', articlesError);
        return;
      }

      // Map articles to include category name
      const articlesWithCategories = (filteredArticlesData || []).map((article: any) => {
        const sourceInfo = filteredSourcesData?.find(s => s.id === article.source_id);
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

      setArticles(articlesWithCategories);
      setOffset(articlesWithCategories.length);
      setHasMore(articlesWithCategories.length >= ARTICLES_PER_PAGE);
      
    } catch (error) {
      console.error('Error fetching filtered articles:', error);
    } finally {
      setIsFilterLoading(false);
    }
  }, [supabase, preferredCategoryIds]);

  // Handle category filter changes
  const handleCategoryFilterChange = useCallback((categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    fetchFilteredArticles(categoryIds, searchQuery, dateFilter, selectedSourceIds);
  }, [fetchFilteredArticles, searchQuery, dateFilter, selectedSourceIds]);

  // Handle search changes with debouncing
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchFilteredArticles(selectedCategoryIds, query, dateFilter, selectedSourceIds);
    }, 300);
  }, [fetchFilteredArticles, selectedCategoryIds, dateFilter, selectedSourceIds]);

  // Handle date filter changes
  const handleDateFilterChange = useCallback((filter: DateFilter) => {
    setDateFilter(filter);
    fetchFilteredArticles(selectedCategoryIds, searchQuery, filter, selectedSourceIds);
  }, [fetchFilteredArticles, selectedCategoryIds, searchQuery, selectedSourceIds]);

  // Handle source filter changes
  const handleSourceFilterChange = useCallback((sourceIds: string[]) => {
    setSelectedSourceIds(sourceIds);
    fetchFilteredArticles(selectedCategoryIds, searchQuery, dateFilter, sourceIds);
  }, [fetchFilteredArticles, selectedCategoryIds, searchQuery, dateFilter]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      // Use current filter selection to determine which sources to query
      const currentCategoryIds = selectedCategoryIds.length > 0 ? selectedCategoryIds : preferredCategoryIds;
      
      // Get source IDs for current filter
      const { data: currentSourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select(`
          id, 
          name, 
          category_id,
          categories (
            id,
            name
          )
        `)
        .in('category_id', currentCategoryIds);

      if (sourcesError) {
        console.error('Error fetching sources for pagination:', sourcesError);
        return;
      }

      let currentSourceIds = currentSourcesData?.map(s => s.id) || [];
      
      // Further filter by selected sources if any are specified
      if (selectedSourceIds.length > 0) {
        currentSourceIds = currentSourceIds.filter(id => selectedSourceIds.includes(id));
      }

      // Use our new user-visible articles function for pagination
      const { data: allMoreArticles, error } = await supabase
        .rpc('get_user_visible_articles', {
          p_user_id: userId,
          p_source_ids: currentSourceIds,
          p_limit: 100, // Get more articles to allow for filtering
          p_offset: offset
        });

      if (error) {
        console.error('Error loading more articles:', error);
        return;
      }

      let moreArticlesData = allMoreArticles || [];

      // Apply search filtering if search term is provided
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        moreArticlesData = moreArticlesData.filter((article: any) =>
          article.title?.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower)
        );
      }

      // Apply date filtering if not 'all'
      if (dateFilter !== 'all') {
        const { start } = getDateRange(dateFilter);
        if (start) {
          moreArticlesData = moreArticlesData.filter((article: any) =>
            new Date(article.published_at) >= start
          );
        }
      }

      // Limit to requested page size
      moreArticlesData = moreArticlesData.slice(0, ARTICLES_PER_PAGE);

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
        const sourceInfo = currentSourcesData?.find(s => s.id === article.source_id);
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
  }, [isLoadingMore, hasMore, offset, selectedCategoryIds, preferredCategoryIds, searchQuery, dateFilter, selectedSourceIds, supabase]);

  // Update visible range based on scroll position
  useEffect(() => {
    const updateVisibleRange = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const articleHeight = 400; // Approximate height of an article card
      const articlesPerRow = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      
      const startIndex = Math.max(0, Math.floor(scrollTop / articleHeight) * articlesPerRow - 10);
      const endIndex = Math.min(
        articles.length,
        Math.ceil((scrollTop + windowHeight * 2) / articleHeight) * articlesPerRow + 10
      );
      
      setVisibleRange({ start: startIndex, end: endIndex });
    };

    const handleScroll = () => {
      updateVisibleRange();
      
      // Load more when approaching end
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMoreArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateVisibleRange);
    
    // Initial calculation
    updateVisibleRange();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateVisibleRange);
    };
  }, [loadMoreArticles, articles.length]);

  // Get visible articles
  const visibleArticles = articles.slice(visibleRange.start, visibleRange.end);

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
      
      {/* Category Filters */}
      <FeedFilters
        selectedCategoryIds={selectedCategoryIds}
        onCategoryFilterChange={handleCategoryFilterChange}
        userPreferredCategories={preferredCategoryIds}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        selectedSourceIds={selectedSourceIds}
        onSourceFilterChange={handleSourceFilterChange}
        availableSources={sourcesData}
      />
      
      {/* Filter Loading State */}
      {isFilterLoading && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={`filter-loading-${index}`} />
            ))}
          </div>
        </div>
      )}
      
      {/* Articles Content */}
      {!isFilterLoading && (
        <>
          {articles.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">No articles found for the selected categories.</p>
              <p className="mt-2">Try selecting different topics or check back later!</p>
              <Button asChild className="mt-4">
                <Link href="/onboarding">Update Your Topics</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Spacer for articles before visible range */}
              {visibleRange.start > 0 && (
                <div style={{ height: `${Math.ceil(visibleRange.start / 3) * 400}px` }} />
              )}
              
              {/* Visible articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleArticles.map((article, index) => (
                  <MemoizedArticleCard 
                    key={article.id} 
                    article={article} 
                    userId={userId} 
                  />
                ))}
              </div>
              
              {/* Spacer for articles after visible range */}
              {visibleRange.end < articles.length && (
                <div style={{ height: `${Math.ceil((articles.length - visibleRange.end) / 3) * 400}px` }} />
              )}
            </>
          )}
        </>
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
          <p className="text-sm mt-1">
            Showing {articles.length} articles • Rendered {visibleArticles.length} visible
          </p>
        </div>
      )}
    </div>
  );
}
