'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    url: string;
    image_url?: string;
    source?: string;
    published_at?: string;
  };
  userId: string | null;
}

export default function ArticleCard({ article, userId }: ArticleCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkSavedStatus() {
      if (!userId || !article.id) return;

      const { data, error } = await supabase
        .from('saved_articles')
        .select('*')
        .eq('user_id', userId)
        .eq('article_id', article.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking saved status:', error);
      }
      setIsSaved(!!data);
    }

    checkSavedStatus();
  }, [article.id, userId, supabase]);

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
        <Button variant="ghost" size="icon" onClick={handleSaveToggle} disabled={!userId}>
          {isSaved ? <BookmarkCheck className="h-5 w-5 text-blue-500" /> : <Bookmark className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}