-- Fix additional HTML entities in existing article titles and descriptions
-- This catches entities that were missed in the previous migration

-- Update titles with additional entities
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
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(title, '&#039;', ''''),
                                    '&#038;', '&'),
                                  '&#034;', '"'),
                                '&#032;', ' '),
                              '&#160;', ' '),
                            '&#8230;', '…'),
                          '&nbsp;', ' '),
                        '&ndash;', '–'),
                      '&mdash;', '—'),
                    '&hellip;', '…'),
                  '&lsquo;', ''''),
                '&rsquo;', ''''),
              '&ldquo;', '"'),
            '&rdquo;', '"'),
          '&trade;', '™'),
        '&copy;', '©'),
      '&reg;', '®'),
    '&deg;', '°')
WHERE title LIKE '%&#%' OR title LIKE '%&%;%';

-- Update descriptions with additional entities
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
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(description, '&#039;', ''''),
                                    '&#038;', '&'),
                                  '&#034;', '"'),
                                '&#032;', ' '),
                              '&#160;', ' '),
                            '&#8230;', '…'),
                          '&nbsp;', ' '),
                        '&ndash;', '–'),
                      '&mdash;', '—'),
                    '&hellip;', '…'),
                  '&lsquo;', ''''),
                '&rsquo;', ''''),
              '&ldquo;', '"'),
            '&rdquo;', '"'),
          '&trade;', '™'),
        '&copy;', '©'),
      '&reg;', '®'),
    '&deg;', '°')
WHERE description IS NOT NULL 
  AND (description LIKE '%&#%' OR description LIKE '%&%;%');
