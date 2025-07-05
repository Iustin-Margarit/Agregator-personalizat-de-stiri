import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink } from 'lucide-react';

interface RelatedArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  slug: string;
  image_url?: string;
  source?: string;
  published_at?: string;
  categories?: {
    id: string;
    name: string;
  } | {
    id: string;
    name: string;
  }[] | null;
}

interface RelatedArticlesProps {
  currentArticleId: string;
  categoryId?: string;
  categoryName?: string;
}

async function getRelatedArticles(currentArticleId: string, categoryId?: string): Promise<RelatedArticle[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('articles')
    .select(`
      id,
      title,
      summary,
      url,
      slug,
      image_url,
      source,
      published_at,
      categories!articles_category_id_fkey (
        id,
        name
      )
    `)
    .neq('id', currentArticleId) // Exclude current article
    .order('published_at', { ascending: false })
    .limit(6);

  // If we have a category, prioritize articles from the same category
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: articles, error } = await query;

  if (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }

  // If we don't have enough articles from the same category, get more from other categories
  if (articles && articles.length < 6 && categoryId) {
    const { data: moreArticles, error: moreError } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        summary,
        url,
        slug,
        image_url,
        source,
        published_at,
        categories!articles_category_id_fkey (
          id,
          name
        )
      `)
      .neq('id', currentArticleId)
      .neq('category_id', categoryId) // Get articles from different categories
      .order('published_at', { ascending: false })
      .limit(6 - articles.length);

    if (!moreError && moreArticles) {
      articles.push(...moreArticles);
    }
  }

  return articles || [];
}

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    // Remove CDATA sections
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export default async function RelatedArticles({ 
  currentArticleId, 
  categoryId, 
  categoryName 
}: RelatedArticlesProps) {
  const relatedArticles = await getRelatedArticles(currentArticleId, categoryId);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Related Articles
        </h2>
        {categoryName && (
          <p className="text-gray-600">
            More articles from <span className="font-medium">{categoryName}</span> and other categories
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <article key={article.id} className="group">
            <Link href={`/article/${article.slug}`} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Article Image */}
                {article.image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* Category Badge */}
                  {article.categories && (
                    <div className="mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {Array.isArray(article.categories)
                          ? article.categories[0]?.name
                          : article.categories.name}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Article Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {truncateText(cleanText(article.title), 80)}
                  </h3>
                  
                  {/* Article Summary */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {truncateText(cleanText(article.summary), 120)}
                  </p>
                  
                  {/* Article Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {article.source && (
                        <span className="font-medium">{cleanText(article.source)}</span>
                      )}
                      {article.published_at && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(article.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-blue-600 group-hover:text-blue-800">
                      <span className="mr-1">Read</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* View More Link */}
      <div className="mt-8 text-center">
        <Link 
          href="/feed" 
          className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          View More Articles
          <ExternalLink className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </section>
  );
}