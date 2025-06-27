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

  const { data: preferredCategoriesData, error: categoriesError } = await supabase
    .from('user_preferred_categories')
    .select('category_id')
    .eq('user_id', user.id);

  if (categoriesError) {
    console.error('Error fetching preferred categories:', categoriesError);
    return <div>Error loading preferred categories.</div>;
  }

  const preferredCategoryIds = preferredCategoriesData?.map((pc) => pc.category_id) || [];

  let articles = [];
  if (savedArticleIds.length > 0 || preferredCategoryIds.length > 0) {
    let query = supabase.from('articles').select('id, title, summary, url, image_url, source, published_at');

    if (savedArticleIds.length > 0 && preferredCategoryIds.length > 0) {
      query = query.or(`id.in.(${savedArticleIds.join(',')}),category_id.in.(${preferredCategoryIds.join(',')})`);
    } else if (savedArticleIds.length > 0) {
      query = query.in('id', savedArticleIds);
    } else if (preferredCategoryIds.length > 0) {
      query = query.in('category_id', preferredCategoryIds);
    }

    const { data: articlesData, error: articlesError } = await query.order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return <div>Error loading articles.</div>;
    }

    // Filter out duplicates if an article appears in both saved and preferred categories
    const uniqueArticles = new Map();
    articlesData?.forEach(article => uniqueArticles.set(article.id, article));
    articles = Array.from(uniqueArticles.values());
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