import { createClient } from '@/lib/supabase/server';
import ArticleCard from '@/components/custom/article-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function SavedPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Not Logged In</h1>
        <p className="text-lg mb-8">Please log in to view your saved articles.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  const { data: savedArticlesData, error: savedArticlesError } = await supabase
    .from('saved_articles')
    .select('article_id')
    .eq('user_id', user.id);

  if (savedArticlesError) {
    console.error('Error fetching saved article IDs:', savedArticlesError);
    return <div>Error loading saved articles.</div>;
  }

  const savedArticleIds = savedArticlesData?.map((sa) => sa.article_id) || [];

  let articles: any[] = [];

  if (savedArticleIds.length > 0) {
    const { data: savedArticlesWithDetails, error: savedError } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        summary,
        url,
        image_url,
        published_at,
        source_id,
        sources (
          name,
          categories (
            name
          )
        )
      `)
      .in('id', savedArticleIds)
      .order('published_at', { ascending: false });

    if (savedError) {
      console.error('Error fetching saved articles:', savedError);
      return <div>Error loading saved articles.</div>;
    }

    // Map the data to the format expected by ArticleCard
    articles = (savedArticlesWithDetails || []).map(article => {
      const sourceInfo = article.sources as any;
      const categoryName = sourceInfo?.categories?.name || 'General';
      
      return {
        id: article.id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        image_url: article.image_url,
        published_at: article.published_at,
        source: sourceInfo?.name || 'Unknown Source',
        category: categoryName,
      };
    });
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Saved Articles</h1>
        <Button asChild>
          <Link href="/onboarding">Preferred Topics</Link>
        </Button>
      </div>
      {articles.length === 0 ? (
        <div className="text-center text-gray-500">
          <p className="text-lg">You haven't saved any articles yet.</p>
          <p>Start exploring and saving articles you like!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} userId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}