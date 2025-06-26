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

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name');

  if (error) {
    console.error('Error fetching categories:', error);
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
        <OnboardingForm categories={categories || []} />
      </div>
    </div>
  );
}