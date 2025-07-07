import { createClient } from '@/lib/supabase/server';
import SavedArticlesManager from '@/components/custom/saved-articles-manager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DisabledArticlesBanner from '@/components/custom/disabled-articles-banner';

// Force this page to be dynamic and not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Fetch all necessary data in parallel for efficiency
  const [
    { data: savedArticlesData, error: savedArticlesError },
    { data: disabledCount, error: countError }
  ] = await Promise.all([
    supabase
      .from('saved_articles')
      .select(`
        article_id,
        folder_id,
        is_read,
        notes,
        saved_at,
        articles!inner (
          id,
          title,
          summary,
          url,
          image_url,
          published_at,
          source_id,
          slug,
          sources!inner (
            name,
            is_enabled,
            categories (
              name
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('articles.sources.is_enabled', true)
      .order('saved_at', { ascending: false }),
    supabase.rpc('get_disabled_saved_article_count', { p_user_id: user.id })
  ]);

  if (savedArticlesError) {
    console.error('Error fetching saved articles:', savedArticlesError);
    return <div>Error loading saved articles.</div>;
  }

  if (countError) {
    console.error("Error fetching disabled article count:", countError);
    // Non-critical error, we can proceed without the banner for now
  }

  // Fetch tags for each saved article
  const savedArticleIds = savedArticlesData?.map(sa => sa.article_id) || [];
  let articleTags: { [key: string]: any[] } = {};

  if (savedArticleIds.length > 0) {
    const { data: tagsData, error: tagsError } = await supabase
      .from('saved_article_tags')
      .select(`
        saved_article_article_id,
        saved_tags (
          id,
          name,
          color
        )
      `)
      .eq('saved_article_user_id', user.id)
      .in('saved_article_article_id', savedArticleIds);

    if (!tagsError && tagsData) {
      // Group tags by article ID
      tagsData.forEach(tagData => {
        const articleId = tagData.saved_article_article_id;
        if (!articleTags[articleId]) {
          articleTags[articleId] = [];
        }
        if (tagData.saved_tags) {
          articleTags[articleId].push(tagData.saved_tags);
        }
      });
    }
  }

  // Transform the data to match the SavedArticle interface
  const articles = (savedArticlesData || []).map(savedArticle => {
    const article = savedArticle.articles as any;
    const sourceInfo = article?.sources as any;
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
      folder_id: savedArticle.folder_id,
      is_read: savedArticle.is_read,
      notes: savedArticle.notes,
      saved_at: savedArticle.saved_at,
      slug: article.slug,
      tags: articleTags[article.id] || []
    };
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('saved_articles_limit')
    .eq('id', user.id)
    .single();

  const articleLimit = profile?.saved_articles_limit || 50;

  return (
    <>
      {disabledCount && disabledCount > 0 ? (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <DisabledArticlesBanner userId={user.id} disabledCount={disabledCount} />
        </div>
      ) : null}
      <SavedArticlesManager
        userId={user.id}
        initialArticles={articles}
        articleCount={articles.length}
        articleLimit={articleLimit}
      />
    </>
  );
}