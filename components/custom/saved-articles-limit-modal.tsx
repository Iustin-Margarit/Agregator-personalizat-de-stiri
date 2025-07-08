'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface SavedArticlesLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onArticleRemoved?: () => void;
}

interface LimitInfo {
  current_count: number;
  limit_count: number;
  oldest_article_title: string;
  oldest_article_id: string;
  oldest_saved_at: string;
}

export default function SavedArticlesLimitModal({ 
  isOpen, 
  onClose, 
  userId, 
  onArticleRemoved 
}: SavedArticlesLimitModalProps) {
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchLimitInfo();
    }
  }, [isOpen, userId]);

  const fetchLimitInfo = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleRemoveOldest = async () => {
    if (!limitInfo) return;
    
    setIsRemoving(true);
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
          message: `Removed: "${result.removed_title}"`
        });
        
        // Refresh limit info
        await fetchLimitInfo();
        
        // Notify parent component
        onArticleRemoved?.();
        
        // Close modal after successful removal
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: result?.message || 'Failed to remove article.'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred.'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleManageSaved = () => {
    window.open('/saved', '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Saved Articles Limit Reached
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : limitInfo ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-foreground mb-2">
                  You've reached your limit of <strong>{limitInfo.limit_count} saved articles</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  To save this article, you'll need to remove one first.
                </p>
              </div>

              {/* Current Status */}
              <div className="bg-muted rounded-lg p-4 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Current Usage</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {limitInfo.current_count}/{limitInfo.limit_count}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(limitInfo.current_count / limitInfo.limit_count) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Oldest Article */}
              {limitInfo.oldest_article_title && (
                <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-foreground mb-2">Oldest Saved Article</h4>
                  <p className="text-sm text-foreground mb-2 line-clamp-2">
                    "{limitInfo.oldest_article_title}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(limitInfo.oldest_saved_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Unable to load limit information.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 p-6 pt-0">
          {limitInfo?.oldest_article_title && (
            <Button
              onClick={handleRemoveOldest}
              disabled={isRemoving}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Removing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Remove Oldest Article
                </div>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleManageSaved}
            variant="outline"
            className="w-full"
          >
            Manage All Saved Articles
          </Button>

          <Button
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}