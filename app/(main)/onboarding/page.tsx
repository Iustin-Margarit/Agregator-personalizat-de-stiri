import { createClient } from '@/lib/supabase/server';
import OnboardingForm from '@/components/custom/onboarding-form';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return <div>Error loading categories. Please try again later.</div>;
  }

  const { data: userPreferences, error: preferencesError } = await supabase
    .from('user_preferred_categories')
    .select('category_id')
    .eq('user_id', user.id);

  if (preferencesError) {
    console.error('Error fetching user preferences:', preferencesError);
    return <div>Error loading user preferences. Please try again later.</div>;
  }

  const initialSelectedCategoryIds = userPreferences.map(
    (pref) => pref.category_id
  );

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return <div>Error loading categories. Please try again later.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Personalize Your Feed</h1>
          <p className="text-muted-foreground">
            Select your favorite topics to get started.
          </p>
        </div>
        <OnboardingForm
          categories={categories || []}
          initialSelectedCategoryIds={initialSelectedCategoryIds}
        />
      </div>
    </div>
  );
}