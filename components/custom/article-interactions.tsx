'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';
import SavedArticlesLimitModal from './saved-articles-limit-modal';

interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  image_url?: string;
  source?: string;
  author?: string;
  published_at?: string;
  created_at: string;
  category_id?: string;
  categories?: {
    id: string;
    name: string;
  };
}

interface ArticleInteractionsProps {
  article: Article;
  userId: string | null;
}

export default function ArticleInteractions({ article, userId }: ArticleInteractionsProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    async function checkSavedAndLikedStatus() {
      if (!userId || !article.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check saved status
        const { data: savedData, error: savedError } = await supabase
          .from('saved_articles')
          .select('*')
          .eq('user_id', userId)
          .eq('article_id', article.id)
          .single();
        
        if (savedError && savedError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking saved status:', savedError);
        }
        setIsSaved(!!savedData);

        // Check liked status
        const { data: likedData, error: likedError } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', userId)
          .eq('article_id', article.id)
          .single();
        
        if (likedError && likedError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking liked status:', likedError);
        }
        setIsLiked(!!likedData);
      } catch (error) {
        console.error('Error checking article status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSavedAndLikedStatus();
  }, [article.id, userId, supabase]);

  const handleLikeToggle = async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to like articles.'
      });
      return;
    }

    // Optimistic UI update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    try {
      if (isLiked) {
        // Unlike article
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', article.id);

        if (error) {
          console.error('Error unliking article:', error);
          // Revert optimistic update on error
          setIsLiked(true);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to unlike article. Please try again.'
          });
        } else {
          // Track analytics for unlike
          await analytics.trackLikeEvent(
            userId, 
            article.id, 
            false, 
            article.categories?.name, 
            article.source
          );
          showToast({
            type: 'success',
            title: 'Article Unliked',
            message: 'Article removed from your liked articles.'
          });
        }
      } else {
        // Like article
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, article_id: article.id });

        if (error) {
          console.error('Error liking article:', error);
          // Revert optimistic update on error
          setIsLiked(false);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to like article. Please try again.'
          });
        } else {
          // Track analytics for like
          await analytics.trackLikeEvent(
            userId, 
            article.id, 
            true, 
            article.categories?.name, 
            article.source
          );
          showToast({
            type: 'success',
            title: 'Article Liked',
            message: 'Article added to your liked articles.'
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong. Please try again.'
      });
    }
  };

  const handleSaveToggle = async () => {
    if (!userId) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        message: 'You need to be logged in to save articles.'
      });
      return;
    }

    try {
      if (isSaved) {
        // Unsave article
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', article.id);

        if (error) {
          console.error('Error unsaving article:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to unsave article. Please try again.'
          });
        } else {
          setIsSaved(false);
          showToast({
            type: 'success',
            title: 'Article Unsaved',
            message: 'Article removed from your saved list.'
          });
        }
      } else {
        // Save article with limit check
        const { data, error } = await supabase
          .rpc('save_article_with_limit_check', {
            user_uuid: userId,
            article_uuid: article.id
          });

        if (error) {
          console.error('Error saving article:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to save article. Please try again.'
          });
          return;
        }

        const result = data?.[0];
        if (result?.success) {
          setIsSaved(true);
          showToast({
            type: 'success',
            title: 'Article Saved',
            message: result.message
          });
        } else {
          // Show limit reached message with beautiful modal
          if (result?.limit_reached) {
            showToast({
              type: 'warning',
              title: 'Saved Articles Limit Reached',
              message: result.message
            });
            // Show the beautiful limit management modal
            setShowLimitModal(true);
          } else {
            showToast({
              type: 'info',
              title: 'Info',
              message: result?.message || 'Unable to save article.'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong. Please try again.'
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.summary,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Article link copied to clipboard.'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Article link copied to clipboard.'
        });
      } catch (clipboardError) {
        showToast({
          type: 'error',
          title: 'Share Failed',
          message: 'Unable to share or copy link.'
        });
      }
    }
  };

  const handleArticleRemoved = () => {
    // This will be called when an article is removed from the modal
    // We can try to save the current article again
    handleSaveToggle();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
      </div>
    );
  }

  return (
    <>
      <SavedArticlesLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        userId={userId || ''}
        onArticleRemoved={handleArticleRemoved}
      />
      
      <div className="flex items-center gap-2">
        <Button 
          variant={isLiked ? "default" : "outline"} 
          size="sm" 
          onClick={handleLikeToggle} 
          disabled={!userId}
          className={isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
        >
          <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
          {isLiked ? 'Liked' : 'Like'}
        </Button>
        
        <Button 
          variant={isSaved ? "default" : "outline"} 
          size="sm" 
          onClick={handleSaveToggle} 
          disabled={!userId}
          className={isSaved ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
          {isSaved ? 'Saved' : 'Save'}
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </>
  );
}