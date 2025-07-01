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

  let articles: any[] = [];
  
  if (savedArticleIds.length > 0) {
    // Get saved articles (these might be either example articles or ingested articles)
    const { data: savedArticles, error: savedError } = await supabase
      .from('articles')
      .select('id, title, summary, url, image_url, source, published_at')
      .in('id', savedArticleIds)
      .order('published_at', { ascending: false });

    if (savedError) {
      console.error('Error fetching saved articles:', savedError);
      return <div>Error loading saved articles.</div>;
    }

    articles = savedArticles || [];
  }

  // Also include recent articles from preferred categories (only ingested ones)
  if (preferredCategoryIds.length > 0) {
    const { data: categoryArticles, error: categoryError } = await supabase
      .from('articles')
      .select(`
        id, 
        title, 
        summary, 
        url, 
        image_url, 
        source, 
        published_at,
        sources!source_id(
          name,
          category_id,
          categories!category_id(
            name
          )
        )
      `)
      .not('source_id', 'is', null) // Only ingested articles
      .order('published_at', { ascending: false })
      .limit(20); // Limit to recent articles

    if (categoryError) {
      console.error('Error fetching category articles:', categoryError);
    } else {
      // Filter by preferred categories and add category names
      const filteredCategoryArticles = (categoryArticles || []).filter(article => {
        const source = Array.isArray(article.sources) ? article.sources[0] : article.sources;
        return source && preferredCategoryIds.includes(source.category_id);
      }).map(article => {
        const source = Array.isArray(article.sources) ? article.sources[0] : article.sources;
        const category = source?.categories ? 
          (Array.isArray(source.categories) ? source.categories[0] : source.categories) : null;
        
        return {
          ...article,
          category: category?.name || 'Unknown'
        };
      });

      // Merge with saved articles and remove duplicates
      const allArticles = [...articles, ...filteredCategoryArticles];
      const uniqueArticles = new Map();
      allArticles.forEach(article => uniqueArticles.set(article.id, article));
      articles = Array.from(uniqueArticles.values());
      
      // Sort by published date
      articles.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
    }
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