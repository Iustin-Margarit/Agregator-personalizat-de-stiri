'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { revalidateSavedAndOnboardingPages } from '@/app/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Category = {
  id: string;
  name: string;
};

interface OnboardingFormProps {
  categories: Category[];
  initialSelectedCategoryIds: string[];
}

export default function OnboardingForm({ categories, initialSelectedCategoryIds }: OnboardingFormProps) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategoryIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to save preferences.');
      setIsLoading(false);
      return;
    }

    // First, delete any existing preferences for the user
    const { error: deleteError } = await supabase
      .from('user_preferred_categories')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      setError('Failed to clear old preferences. Please try again.');
      console.error('Error deleting preferences:', deleteError);
      setIsLoading(false);
      return;
    }

    const preferencesToInsert = selectedCategories.map((categoryId) => ({
      user_id: user.id,
      category_id: categoryId,
    }));

    let insertError: any = null;
    // Only insert if there are categories selected
    if (preferencesToInsert.length > 0) {
      const { error } = await supabase
        .from('user_preferred_categories')
        .insert(preferencesToInsert);
      insertError = error;
    }

    if (insertError) {
      setError('Failed to save preferences. Please try again.');
      console.error('Error inserting preferences:', insertError);
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', user.id);

    if (profileError) {
      setError('Failed to update your profile. Please try again.');
      console.error('Error updating profile:', profileError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    await revalidateSavedAndOnboardingPages(); // Revalidate paths to force data re-fetch
    router.push('/saved');
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Select Topics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryChange(category.id)}
              />
              <Label htmlFor={category.id} className="cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button type="submit" disabled={isLoading || selectedCategories.length === 0}>
            {isLoading ? 'Saving...' : 'Save and Continue'}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardFooter>
      </form>
    </Card>
  );
}