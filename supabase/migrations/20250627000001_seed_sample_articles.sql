-- Seed sample articles into the articles table

INSERT INTO public.articles (title, summary, url, image_url, published_at, source, author, category_id) VALUES
(
    'Breakthrough in AI Could Revolutionize Medicine',
    'Researchers have developed a new AI model capable of accurately diagnosing diseases from medical images with unprecedented speed.',
    'https://example.com/ai-medical-breakthrough-1',
    'https://example.com/ai-medical-breakthrough-1.jpg',
    '2024-06-25T10:00:00Z',
    'Tech Daily',
    'Dr. Alex Tech',
    (SELECT id FROM public.categories WHERE name = 'Technology')
),
(
    'Global Markets React to New Economic Policies',
    'Stock markets worldwide saw significant shifts following the announcement of new fiscal policies by major economies.',
    'https://example.com/global-markets-economy-2',
    'https://example.com/global-markets-economy-2.jpg',
    '2024-06-25T11:30:00Z',
    'Business Insider',
    'Jane Doe',
    (SELECT id FROM public.categories WHERE name = 'Business')
),
(
    'New Study Reveals Secrets of Ancient Civilizations',
    'Archaeologists uncover startling evidence that sheds new light on the daily lives and practices of an unknown ancient society.',
    'https://example.com/ancient-civilizations-archaeology-3',
    'https://example.com/ancient-civilizations-archaeology-3.jpg',
    '2024-06-24T15:45:00Z',
    'Science Today',
    'Prof. Sarah Bellum',
    (SELECT id FROM public.categories WHERE name = 'Science')
),
(
    'Healthy Eating Tips for a Busy Lifestyle',
    'Nutritionists share practical advice on maintaining a balanced diet even with a packed schedule.',
    'https://example.com/healthy-eating-tips-4',
    'https://example.com/healthy-eating-tips-4.jpg',
    '2024-06-23T09:15:00Z',
    'Health Connect',
    'Dr. Emma Green',
    (SELECT id FROM public.categories WHERE name = 'Health')
),
(
    'Major Upset in World Sports Championship',
    'Underdog team clinches a dramatic victory in the final match, shocking fans and experts alike.',
    'https://example.com/sports-upset-championship-5',
    'https://example.com/sports-upset-championship-5.jpg',
    '2024-06-22T18:00:00Z',
    'Sports News',
    'Chris Runner',
    (SELECT id FROM public.categories WHERE name = 'Sports')
);