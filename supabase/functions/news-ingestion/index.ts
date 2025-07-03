// @deno-types="https://deno.land/x/xhr@0.3.0/mod.d.ts"
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("News ingestion function starting...")

interface Article {
  title: string
  description: string
  url: string
  published_at: string
  source_id: string
  content?: string
  content_hash: string
  image_url?: string
  author?: string
}

interface RSSItem {
  title?: string
  description?: string
  link?: string
  pubDate?: string
  'content:encoded'?: string
  'media:content'?: { url?: string }
  'dc:creator'?: string
  author?: string
}

// HTML entity decoder function
function decodeHtmlEntities(text: string): string {
  const entityMap: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&#38;': '&', // Added this
    '&#034;': '"',
    '&#039;': "'", // Added this
    '&#8216;': "'", // Left single quotation mark
    '&#8217;': "'", // Right single quotation mark
    '&#8220;': '"', // Left double quotation mark
    '&#8221;': '"', // Right double quotation mark
    '&#8211;': '–', // En dash
    '&#8212;': '—', // Em dash
    '&#8230;': '…', // Horizontal ellipsis
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"'
  }
  
  let decoded = text
  
  // Replace named entities
  for (const [entity, replacement] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement)
  }
  
  // Replace numeric entities (&#num;)
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10))
  })
  
  // Replace hex entities (&#xhex;)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
  
  return decoded
}

// Simple XML parser for RSS feeds with enhanced error handling
function parseRSSFeed(xmlText: string): RSSItem[] {
  const items: RSSItem[] = []
  
  try {
    // Normalize whitespace and remove potential BOM
    const cleanXml = xmlText.replace(/^\uFEFF/, '').trim()
    
    if (!cleanXml) {
      throw new Error('Empty XML content')
    }
    
    // Extract items using regex (simple approach for RSS parsing)
    const itemMatches = cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi)
    const entryMatches = cleanXml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) // Atom feeds
    
    const allMatches = [...(itemMatches || []), ...(entryMatches || [])]
    
    if (allMatches.length === 0) {
      console.log('No RSS items or Atom entries found in feed')
      return items
    }
    
    console.log(`Found ${allMatches.length} potential articles in feed`)
    
    for (const itemXml of allMatches) {
      try {
        const item: RSSItem = {}
        
        // Extract title with better error handling and multi-line support
        const titleMatch = itemXml.match(/<(?:title|atom:title)[^>]*>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/(?:title|atom:title)>/i)
        if (titleMatch) {
          let title = (titleMatch[1] || titleMatch[2])?.trim()
          if (title && title.length > 0) {
            // Clean up whitespace and newlines
            title = title.replace(/\s+/g, ' ').trim()
            item.title = decodeHtmlEntities(title)
          }
        }
        
        // Extract description with multiple possible tags and multi-line support
        const descMatch = itemXml.match(/<(?:description|summary|content|atom:summary)[^>]*>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/(?:description|summary|content|atom:summary)>/i)
        if (descMatch) {
          let desc = (descMatch[1] || descMatch[2])?.trim()
          if (desc && desc.length > 0) {
            // Clean up HTML tags and normalize whitespace
            desc = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
            item.description = decodeHtmlEntities(desc)
          }
        }
        
        // Extract link with multiple possible formats including CDATA and multi-line support
        const linkMatch = itemXml.match(/<(?:link|atom:link)[^>]*(?:href="([^"]*)"[^>]*>|>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/(?:link|atom:link)>)/i)
        if (linkMatch) {
          let link = (linkMatch[1] || linkMatch[2] || linkMatch[3])?.trim()
          if (link && link.length > 0) {
            // Remove any extra whitespace/newlines from URL
            link = link.replace(/\s+/g, '').trim()
            item.link = link
          }
        }
        
        // Extract pubDate with multiple possible formats and multi-line support
        const dateMatch = itemXml.match(/<(?:pubDate|published|atom:published|dc:date|lastBuildDate)[^>]*>\s*([\s\S]*?)\s*<\/(?:pubDate|published|atom:published|dc:date|lastBuildDate)>/i)
        if (dateMatch) {
          const date = dateMatch[1]?.trim()
          if (date && date.length > 0) {
            item.pubDate = date
          }
        }
        
        // Extract content:encoded with multi-line support
        const contentMatch = itemXml.match(/<content:encoded[^>]*>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/content:encoded>/i)
        if (contentMatch) {
          const content = (contentMatch[1] || contentMatch[2])?.trim()
          if (content && content.length > 0) {
            item['content:encoded'] = content
          }
        }
        
        // Extract author with multiple possible tags and multi-line support
        const authorMatch = itemXml.match(/<(?:dc:creator|author|managingEditor|atom:author)[^>]*>\s*(?:<name>)?([\s\S]*?)(?:<\/name>)?\s*<\/(?:dc:creator|author|managingEditor|atom:author)>/i)
        if (authorMatch) {
          let author = authorMatch[1]?.trim()
          if (author && author.length > 0) {
            // Clean up whitespace
            author = author.replace(/\s+/g, ' ').trim()
            item.author = author
          }
        }
        
        // Only add items that have at least a title and either a link or description
        if (item.title && (item.link || item.description)) {
          items.push(item)
        } else {
          console.log(`Skipped incomplete item: title="${item.title}", link="${item.link}", desc="${item.description?.substring(0, 50)}..."`)
        }
        
      } catch (itemError) {
        console.error('Error parsing individual RSS item:', itemError)
        // Continue processing other items even if one fails
        continue
      }
    }
    
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    throw new Error(`RSS parsing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  console.log(`Successfully parsed ${items.length} valid items from RSS feed`)
  return items
}

// Generate a simple hash for content deduplication
function generateContentHash(title: string, url: string): string {
  const content = `${title}|${url}`
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Clean and validate article data
function processArticle(item: RSSItem, sourceId: string): Article | null {
  try {
    if (!item.title || !item.link) {
      console.log('Skipping article: missing title or link')
      return null
    }
    
    // Validate title is not empty after trimming
    const title = item.title.trim()
    if (!title || title.length < 3) {
      console.log('Skipping article: title too short:', title)
      return null
    }
    
    // Validate and clean URL
    let cleanUrl: string
    try {
      const urlString = item.link.trim()
      
      // Handle relative URLs by checking if it starts with http/https
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        console.log('Skipping article: invalid URL scheme:', urlString)
        return null
      }
      
      const url = new URL(urlString)
      
      // Basic URL validation
      if (!url.hostname || url.hostname.length < 3) {
        console.log('Skipping article: invalid hostname:', url.hostname)
        return null
      }
      
      cleanUrl = url.toString()
      
      // Check for obviously invalid URLs
      if (cleanUrl.length > 2000) {
        console.log('Skipping article: URL too long:', cleanUrl.length)
        return null
      }
      
    } catch (urlError) {
      console.log('Skipping article: invalid URL:', item.link, urlError)
      return null
    }
    
    // Parse and validate publish date
    let publishedAt: string
    try {
      if (item.pubDate && item.pubDate.trim()) {
        const parsedDate = new Date(item.pubDate.trim())
        if (isNaN(parsedDate.getTime())) {
          console.log('Invalid date format:', item.pubDate)
          publishedAt = new Date().toISOString()
        } else {
          // Check for reasonable date bounds (not too far in future or past)
          const now = new Date()
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          
          if (parsedDate < oneYearAgo || parsedDate > oneWeekFromNow) {
            console.log('Date out of reasonable range, using current time:', parsedDate)
            publishedAt = new Date().toISOString()
          } else {
            publishedAt = parsedDate.toISOString()
          }
        }
      } else {
        publishedAt = new Date().toISOString()
      }
    } catch (dateError) {
      console.log('Date parsing error, using current time:', item.pubDate, dateError)
      publishedAt = new Date().toISOString()
    }
    
    // Clean HTML from description with better sanitization
    let description = ''
    try {
      if (item.description && item.description.trim()) {
        description = item.description
          .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
          .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&') // Do this last
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 500) // Limit description length
      }
    } catch (descError) {
      console.log('Error processing description:', descError)
      description = ''
    }
    
    // Extract content with better sanitization
    let content = ''
    try {
      if (item['content:encoded'] && item['content:encoded'].trim()) {
        content = item['content:encoded']
          .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
          .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&') // Do this last
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 5000) // Limit content length
      }
    } catch (contentError) {
      console.log('Error processing content:', contentError)
      content = ''
    }
    
    // Use description as fallback content if no content:encoded
    if (!content && description) {
      content = description
    }
    
    // Generate content hash for deduplication
    let contentHash: string
    try {
      contentHash = generateContentHash(title, cleanUrl)
    } catch (hashError) {
      console.error('Error generating content hash:', hashError)
      return null
    }
    
    // Process author name
    let author = ''
    try {
      if (item.author && item.author.trim()) {
        author = item.author
          .trim()
          .replace(/\s+/g, ' ')
          .substring(0, 100) // Limit author length
      }
    } catch (authorError) {
      console.log('Error processing author:', authorError)
      author = ''
    }
    
    // Validate final article data
    if (title.length > 500) {
      console.log('Title too long, truncating:', title.length)
    }
    
    return {
      title: title.substring(0, 200), // Ensure title fits in database
      description,
      url: cleanUrl,
      published_at: publishedAt,
      source_id: sourceId,
      content: content || description,
      content_hash: contentHash,
      author: author || undefined,
    }
    
  } catch (error) {
    console.error('Error processing article:', error)
    return null
  }
}

serve(async (req: Request) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log("Starting news ingestion process...")
    
    // Get all active sources from the database
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)
    
    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      throw sourcesError
    }
    
    console.log(`Found ${sources?.length || 0} active sources`)
    
    let totalProcessed = 0
    let totalInserted = 0
    const errors: string[] = []
    
    // Process each source
    for (const source of sources || []) {
      try {
        console.log(`Processing source: ${source.name} (${source.rss_url})`)
        
        // Validate RSS URL
        if (!source.rss_url || typeof source.rss_url !== 'string') {
          throw new Error('Invalid RSS URL')
        }
        
        // Validate URL format
        try {
          new URL(source.rss_url)
        } catch {
          throw new Error('Invalid RSS URL format')
        }
        
        // Fetch RSS feed with comprehensive error handling and retries
        let response: Response
        let attempt = 0
        const maxRetries = 3
        const baseDelay = 1000 // 1 second base delay
        
        while (attempt < maxRetries) {
          try {
            attempt++
            console.log(`Fetching ${source.name} (attempt ${attempt}/${maxRetries})`)
            
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
            
            response = await fetch(source.rss_url, {
              headers: {
                'User-Agent': 'PersonalizedNewsAggregator/1.0 (Contact: admin@newsaggregator.com)',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache'
              },
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            // Handle different HTTP status codes appropriately
            if (response.ok) {
              break // Success, exit retry loop
            } else if (response.status === 429) {
              // Rate limited - wait longer before retry
              if (attempt < maxRetries) {
                const retryAfter = response.headers.get('Retry-After')
                const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt)
                console.log(`Rate limited, waiting ${delayMs}ms before retry`)
                await new Promise(resolve => setTimeout(resolve, delayMs))
                continue
              }
            } else if (response.status >= 500) {
              // Server error - retry with exponential backoff
              if (attempt < maxRetries) {
                const delayMs = baseDelay * Math.pow(2, attempt - 1)
                console.log(`Server error ${response.status}, waiting ${delayMs}ms before retry`)
                await new Promise(resolve => setTimeout(resolve, delayMs))
                continue
              }
            } else if ([400, 401, 403, 404, 410].includes(response.status)) {
              // Client error - don't retry, these won't be fixed by retrying
              throw new Error(`HTTP ${response.status}: ${response.statusText} (permanent error)`)
            }
            
            // If we get here, it's an unexpected status code
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            
          } catch (fetchError) {
            if (fetchError instanceof Error) {
              if (fetchError.name === 'AbortError') {
                throw new Error(`Request timeout after 45 seconds`)
              } else if (fetchError.message.includes('permanent error')) {
                throw fetchError // Don't retry permanent errors
              } else if (attempt < maxRetries) {
                // Network error - retry with exponential backoff
                const delayMs = baseDelay * Math.pow(2, attempt - 1)
                console.log(`Network error: ${fetchError.message}, waiting ${delayMs}ms before retry`)
                await new Promise(resolve => setTimeout(resolve, delayMs))
                continue
              }
            }
            throw fetchError
          }
        }
        
        if (!response!) {
          throw new Error(`Failed to fetch after ${maxRetries} attempts`)
        }
        
        // Parse RSS feed with better error handling
        let xmlText: string
        try {
          xmlText = await response.text()
          
          // Validate that we got actual XML content
          if (!xmlText.trim()) {
            throw new Error('Empty response body')
          }
          
          // Basic XML validation
          if (!xmlText.includes('<rss') && !xmlText.includes('<feed') && !xmlText.includes('<channel>')) {
            throw new Error('Response does not appear to be valid RSS/Atom XML')
          }
          
          console.log(`Fetched RSS feed, size: ${xmlText.length} characters`)
        } catch (parseError) {
          throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
        }
        
        // Parse RSS feed with error handling
        let items: RSSItem[]
        try {
          items = parseRSSFeed(xmlText)
          console.log(`Parsed ${items.length} items from RSS feed`)
          
          if (items.length === 0) {
            console.log(`Warning: No valid items found in RSS feed for ${source.name}`)
            // Continue processing other sources instead of throwing
            continue
          }
        } catch (rssError) {
          throw new Error(`RSS parsing failed: ${rssError instanceof Error ? rssError.message : String(rssError)}`)
        }
        
        // Process each article with individual error handling
        let sourceArticlesProcessed = 0
        let sourceArticlesInserted = 0
        const sourceErrors: string[] = []
        
        for (const item of items) {
          try {
            const article = processArticle(item, source.id)
            if (!article) {
              console.log(`Skipped invalid article: ${item.title || 'no title'}`)
              continue
            }
            
            totalProcessed++
            sourceArticlesProcessed++
            
            // Check if article already exists (by content hash or URL)
            const { data: existingByHash, error: hashCheckError } = await supabase
              .from('articles')
              .select('id')
              .eq('content_hash', article.content_hash)
              .maybeSingle()
            
            if (hashCheckError) {
              throw new Error(`Database error checking content hash: ${hashCheckError.message}`)
            }
            
            const { data: existingByUrl, error: urlCheckError } = await supabase
              .from('articles')
              .select('id')
              .eq('url', article.url)
              .maybeSingle()
            
            if (urlCheckError) {
              throw new Error(`Database error checking URL: ${urlCheckError.message}`)
            }
            
            if (existingByHash || existingByUrl) {
              console.log(`Article already exists: ${article.title.substring(0, 50)}...`)
              continue
            }
            
            // Insert new article with retry logic for transient database errors
            let insertAttempt = 0
            const maxInsertRetries = 2
            
            while (insertAttempt < maxInsertRetries) {
              try {
                insertAttempt++
                const { error: insertError } = await supabase
                  .from('articles')
                  .insert([article])
                
                if (insertError) {
                  // Check if it's a retryable error
                  if (insertError.code === '23505') {
                    // Unique constraint violation - article was inserted by another process
                    console.log(`Article already exists (race condition): ${article.title.substring(0, 50)}...`)
                    break
                  } else if (['08000', '08003', '08006', '57P01'].includes(insertError.code || '')) {
                    // Connection errors - retry
                    if (insertAttempt < maxInsertRetries) {
                      console.log(`Database connection error, retrying: ${insertError.message}`)
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      continue
                    }
                  }
                  throw new Error(`Database insert failed: ${insertError.message} (code: ${insertError.code})`)
                }
                
                totalInserted++
                sourceArticlesInserted++
                console.log(`Inserted article: ${article.title.substring(0, 50)}...`)
                break // Success, exit retry loop
                
              } catch (insertError) {
                if (insertAttempt >= maxInsertRetries) {
                  throw insertError
                }
              }
            }
            
          } catch (articleError) {
            const errorMessage = articleError instanceof Error ? articleError.message : String(articleError)
            console.error(`Error processing article from ${source.name}:`, articleError)
            sourceErrors.push(errorMessage)
            
            // Don't let individual article errors stop processing of other articles
            continue
          }
        }
        
        // Add source-level errors to main errors array
        if (sourceErrors.length > 0) {
          errors.push(...sourceErrors.map(err => `${source.name}: ${err}`))
        }
        
        console.log(`Source ${source.name} completed: ${sourceArticlesProcessed} processed, ${sourceArticlesInserted} inserted, ${sourceErrors.length} errors`)
        
        // Update source's last_fetched_at timestamp
        try {
          const { error: updateError } = await supabase
            .from('sources')
            .update({ last_fetched_at: new Date().toISOString() })
            .eq('id', source.id)
          
          if (updateError) {
            console.error(`Failed to update last_fetched_at for source ${source.name}:`, updateError)
            // Don't throw - this is not critical enough to fail the entire process
          }
        } catch (timestampError) {
          console.error(`Error updating source timestamp for ${source.name}:`, timestampError)
          // Continue processing - timestamp update failure shouldn't stop the pipeline
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Error processing source ${source.name}:`, error)
        errors.push(`${source.name}: ${errorMessage}`)
      }
    }
    
    const result = {
      success: true,
      processed: totalProcessed,
      inserted: totalInserted,
      sources_processed: sources?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }
    
    console.log('News ingestion completed:', result)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Fatal error in news ingestion:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/news-ingestion' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
