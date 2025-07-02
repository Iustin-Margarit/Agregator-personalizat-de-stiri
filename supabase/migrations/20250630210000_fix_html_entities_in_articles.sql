-- Fix HTML entities in existing article titles and descriptions
-- This cleans up articles that were ingested before the HTML entity decoder was added

-- Update titles
UPDATE public.articles 
SET title = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(title, '&amp;', '&'),
                        '&lt;', '<'),
                      '&gt;', '>'),
                    '&quot;', '"'),
                  '&apos;', ''''),
                '&#39;', ''''),
              '&#8216;', ''''),
            '&#8217;', ''''),
          '&#8220;', '"'),
        '&#8221;', '"'),
      '&#8211;', '–'),
    '&#8212;', '—')
WHERE title LIKE '%&#%' OR title LIKE '%&amp;%' OR title LIKE '%&lt;%' OR title LIKE '%&gt;%' OR title LIKE '%&quot;%' OR title LIKE '%&apos;%';

-- Update descriptions
UPDATE public.articles 
SET description = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(description, '&amp;', '&'),
                        '&lt;', '<'),
                      '&gt;', '>'),
                    '&quot;', '"'),
                  '&apos;', ''''),
                '&#39;', ''''),
              '&#8216;', ''''),
            '&#8217;', ''''),
          '&#8220;', '"'),
        '&#8221;', '"'),
      '&#8211;', '–'),
    '&#8212;', '—')
WHERE description IS NOT NULL 
  AND (description LIKE '%&#%' OR description LIKE '%&amp;%' OR description LIKE '%&lt;%' OR description LIKE '%&gt;%' OR description LIKE '%&quot;%' OR description LIKE '%&apos;%');
