'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { analytics } from '@/lib/analytics';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    url: string;
    image_url?: string;
    source?: string;
    published_at?: string;
    category?: string; // Added category prop
  };
  userId: string | null;
}

export default function ArticleCard({ article, userId }: ArticleCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkSavedAndLikedStatus() {
      if (!userId || !article.id) return;

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
    }

    checkSavedAndLikedStatus();
  }, [article.id, userId, supabase]);

  const handleLikeToggle = async () => {
    if (!userId) {
      alert('You need to be logged in to like articles.');
      return;
    }

    // Optimistic UI update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

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
      } else {
        // Track analytics for unlike
        await analytics.trackLikeEvent(
          userId, 
          article.id, 
          false, 
          article.category, 
          article.source
        );
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
      } else {
        // Track analytics for like
        await analytics.trackLikeEvent(
          userId, 
          article.id, 
          true, 
          article.category, 
          article.source
        );
      }
    }
  };

  const handleSaveToggle = async () => {
    if (!userId) {
      alert('You need to be logged in to save articles.');
      return;
    }

    if (isSaved) {
      // Unsave article
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id);

      if (error) {
        console.error('Error unsaving article:', error);
      } else {
        setIsSaved(false);
      }
    } else {
      // Save article
      const { error } = await supabase
        .from('saved_articles')
        .insert({ user_id: userId, article_id: article.id });

      if (error) {
        console.error('Error saving article:', error);
      } else {
        setIsSaved(true);
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full h-48 object-cover rounded-md mb-4" />
      )}
      
      {/* Category badge */}
      {article.category && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 w-fit">
          {article.category}
        </span>
      )}
      
      <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
      {article.source && <p className="text-sm text-gray-500 mb-1">{article.source}</p>}
      {article.published_at && (
        <p className="text-sm text-gray-500 mb-2">
          {new Date(article.published_at).toLocaleDateString()}
        </p>
      )}
      <p className="text-gray-700 flex-grow mb-4">{article.summary}</p>
      <div className="flex items-center justify-between mt-auto">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Read More
        </a>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleLikeToggle} disabled={!userId}>
            <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveToggle} disabled={!userId}>
            {isSaved ? <BookmarkCheck className="h-5 w-5 text-blue-500" /> : <Bookmark className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}