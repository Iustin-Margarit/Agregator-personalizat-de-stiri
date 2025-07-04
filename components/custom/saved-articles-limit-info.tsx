'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { Trash2, AlertCircle, Crown } from 'lucide-react';

interface SavedArticlesLimitInfoProps {
  userId: string;
}

export default function SavedArticlesLimitInfo({ userId }: SavedArticlesLimitInfoProps) {
  const [limitInfo, setLimitInfo] = useState<{
    current_count: number;
    limit_count: number;
    oldest_saved_article_title?: string;
    oldest_saved_date?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { showToast } = useToast();

  const fetchLimitInfo = async () => {
    try {
      const { data, error } = await supabase
        .rpc('can_user_save_article', { user_uuid: userId });

      if (error) {
        console.error('Error fetching limit info:', error);
        return;
      }

      if (data && data.length > 0) {
        setLimitInfo(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOldest = async () => {
    if (!limitInfo?.oldest_saved_article_title) return;

    const confirmed = confirm(
      `Remove "${limitInfo.oldest_saved_article_title}" from your saved articles?`
    );

    if (!confirmed) return;

    try {
      const { data, error } = await supabase
        .rpc('remove_oldest_saved_article', { user_uuid: userId });

      if (error) {
        console.error('Error removing oldest article:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to remove article. Please try again.'
        });
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        showToast({
          type: 'success',
          title: 'Article Removed',
          message: `"${result.removed_article_title}" has been removed from your saved articles.`
        });
        // Refresh the limit info
        await fetchLimitInfo();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLimitInfo();
    }
  }, [userId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading limit info...</div>;
  }

  if (!limitInfo) {
    return null;
  }

  const isNearLimit = limitInfo.current_count >= limitInfo.limit_count * 0.8; // 80% of limit
  const isAtLimit = limitInfo.current_count >= limitInfo.limit_count;

  return (
    <div className={`p-4 rounded-lg border ${isAtLimit ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAtLimit && <AlertCircle className="h-5 w-5 text-red-500" />}
          <span className="font-medium">
            Saved Articles: {limitInfo.current_count}/{limitInfo.limit_count}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isAtLimit && limitInfo.oldest_saved_article_title && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveOldest}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Oldest
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
      
      {isAtLimit && (
        <p className="text-sm text-red-600 mt-2">
          You've reached your saved articles limit. Remove some articles or upgrade to premium for more storage.
        </p>
      )}
      
      {isNearLimit && !isAtLimit && (
        <p className="text-sm text-yellow-600 mt-2">
          You're approaching your saved articles limit ({limitInfo.current_count}/{limitInfo.limit_count}).
        </p>
      )}
      
      {limitInfo.oldest_saved_article_title && (
        <p className="text-xs text-gray-500 mt-1">
          Oldest saved: "{limitInfo.oldest_saved_article_title}" 
          {limitInfo.oldest_saved_date && ` (${new Date(limitInfo.oldest_saved_date).toLocaleDateString()})`}
        </p>
      )}
    </div>
  );
}