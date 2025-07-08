'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, X, Filter, Search, Calendar, Newspaper } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
}

interface Source {
  id: string;
  name: string;
  categories?: {
    name: string;
  };
}

type DateFilter = 'all' | 'today' | 'week' | 'month';

interface FeedFiltersProps {
  selectedCategoryIds: string[];
  onCategoryFilterChange: (categoryIds: string[]) => void;
  userPreferredCategories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  selectedSourceIds: string[];
  onSourceFilterChange: (sourceIds: string[]) => void;
  availableSources: Source[];
}

export default function FeedFilters({
  selectedCategoryIds,
  onCategoryFilterChange,
  userPreferredCategories,
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  selectedSourceIds,
  onSourceFilterChange,
  availableSources
}: FeedFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, [supabase]);

  const handleCategoryToggle = (categoryId: string) => {
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    onCategoryFilterChange(newSelectedIds);
  };

  const handleSourceToggle = (sourceId: string) => {
    const newSelectedIds = selectedSourceIds.includes(sourceId)
      ? selectedSourceIds.filter(id => id !== sourceId)
      : [...selectedSourceIds, sourceId];
    
    onSourceFilterChange(newSelectedIds);
  };

  const handleShowAll = () => {
    onCategoryFilterChange(userPreferredCategories);
  };

  const handleClearAll = () => {
    onCategoryFilterChange([]);
  };

  const handleClearSources = () => {
    onSourceFilterChange([]);
  };

  const handleShowAllSources = () => {
    onSourceFilterChange(availableSources.map(s => s.id));
  };

  const selectedCount = selectedCategoryIds.length;
  const totalUserCategories = userPreferredCategories.length;
  const isShowingAll = selectedCategoryIds.length === userPreferredCategories.length &&
    userPreferredCategories.every(id => selectedCategoryIds.includes(id));

  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-card border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading filters...</span>
          </div>
      </div>
    );
  }

  // Get user's preferred categories for display
  const userCategories = categories.filter(cat => userPreferredCategories.includes(cat.id));
  const otherCategories = categories.filter(cat => !userPreferredCategories.includes(cat.id));

  return (
    <div className="mb-6 p-4 bg-card border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-foreground" />
                <h3 className="font-medium text-foreground">Filter by Category</h3>
                <Badge variant="secondary" className="text-xs">
                    {selectedCount === 0 ? 'None selected' :
                        isShowingAll ? 'All topics' :
                        `${selectedCount} selected`}
                </Badge>
            </div>
        
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          
          {!isShowingAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="text-xs h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Show All
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>

      {/* Search functionality */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles by title or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Date filtering */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-foreground" />
          <p className="text-sm text-foreground">Time Range</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' }
          ].map((option) => (
            <Button
              key={option.value}
              variant={dateFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onDateFilterChange(option.value as DateFilter)}
              className="h-8 text-sm"
            >
              {option.label}
              {dateFilter === option.value && <Check className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Always show user's preferred categories */}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-foreground mb-2">Your Topics</p>
          <div className="flex flex-wrap gap-2">
            {userCategories.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category.id)}
                  className="h-8 text-sm"
                >
                  {category.name}
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Show other categories when expanded */}
        {isExpanded && otherCategories.length > 0 && (
          <div>
            <p className="text-sm text-foreground mb-2">Other Categories</p>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryToggle(category.id)}
                    className="h-8 text-sm"
                  >
                    {category.name}
                    {isSelected && <Check className="h-3 w-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Source filtering */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-foreground" />
            <p className="text-sm text-foreground">News Sources</p>
            <Badge variant="secondary" className="text-xs">
              {selectedSourceIds.length === 0 ? 'All sources' : `${selectedSourceIds.length} selected`}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedSourceIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSources}
                className="text-xs h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              className="text-xs h-7"
            >
              {isSourcesExpanded ? 'Hide' : 'Show'} Sources
            </Button>
          </div>
        </div>

        {/* Show sources when expanded */}
        {isSourcesExpanded && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowAllSources}
                className="text-xs h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Select All
              </Button>
            </div>
            
            {/* Group sources by category for better organization */}
            {Object.entries(
              availableSources.reduce((acc, source) => {
                const categoryName = source.categories?.name || 'Other';
                if (!acc[categoryName]) acc[categoryName] = [];
                acc[categoryName].push(source);
                return acc;
              }, {} as Record<string, Source[]>)
            ).map(([categoryName, sources]) => (
              <div key={categoryName} className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">{categoryName}</p>
                <div className="flex flex-wrap gap-1">
                  {sources.map((source) => {
                    const isSelected = selectedSourceIds.includes(source.id);
                    return (
                      <Button
                        key={source.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSourceToggle(source.id)}
                        className="h-7 text-xs"
                      >
                        {source.name}
                        {isSelected && <Check className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter status message */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-muted-foreground">
          {searchQuery ? (
            `Searching for "${searchQuery}"${selectedCount > 0 ? ` in ${selectedCount} selected ${selectedCount === 1 ? 'category' : 'categories'}` : ''}${selectedSourceIds.length > 0 ? ` from ${selectedSourceIds.length} selected ${selectedSourceIds.length === 1 ? 'source' : 'sources'}` : ''}${dateFilter !== 'all' ? ` from ${dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'last 7 days' : 'last 30 days'}` : ''}`
          ) : (
            selectedCount === 0 
              ? `Select categories to filter your feed${selectedSourceIds.length > 0 ? ` (${selectedSourceIds.length} ${selectedSourceIds.length === 1 ? 'source' : 'sources'} selected)` : ''}${dateFilter !== 'all' ? ` (showing ${dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'last 7 days' : 'last 30 days'})` : ''}`
              : isShowingAll 
                ? `Showing articles from all your topics${selectedSourceIds.length > 0 ? ` from ${selectedSourceIds.length} selected ${selectedSourceIds.length === 1 ? 'source' : 'sources'}` : ''}${dateFilter !== 'all' ? ` from ${dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'last 7 days' : 'last 30 days'}` : ''}`
                : `Showing articles from ${selectedCount} selected ${selectedCount === 1 ? 'category' : 'categories'}${selectedSourceIds.length > 0 ? ` from ${selectedSourceIds.length} selected ${selectedSourceIds.length === 1 ? 'source' : 'sources'}` : ''}${dateFilter !== 'all' ? ` from ${dateFilter === 'today' ? 'today' : dateFilter === 'week' ? 'last 7 days' : 'last 30 days'}` : ''}`
          )}
        </p>
      </div>
    </div>
  );
}