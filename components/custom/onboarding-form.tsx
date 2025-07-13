'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { completeOnboarding } from '@/app/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

type Category = {
  id: string;
  name: string;
};

interface OnboardingFormProps {
  categories: Category[];
  initialSelectedCategoryIds: string[];
  initialUsername: string;
  hasCompletedOnboarding: boolean;
  user: User | null;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save and Continue'}
        </Button>
    )
}

export default function OnboardingForm({
  categories,
  initialSelectedCategoryIds,
  initialUsername,
  hasCompletedOnboarding,
  user,
}: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername || '');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategoryIds);
  
  const [state, formAction] = useFormState(completeOnboarding, null);

  useEffect(() => {
    if (user && user.email) {
      const emailName = user.email.split('@')[0] || '';
      const suggestions = [
        emailName,
        `${emailName}123`,
        `${emailName}_news`,
        `${emailName}_reader`,
      ].filter(Boolean);
      setUsernameSuggestions(suggestions);
    }
  }, [user]);

  useEffect(() => {
      if (state?.success) {
          router.push('/feed');
      }
  }, [state, router]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Card>
      <form action={formAction}>
        <CardContent className="space-y-6 pt-6">
          {/* Hidden username field to pass the current username */}
          <input
            type="hidden"
            name="username"
            value={username}
          />
          <div className="space-y-2">
            <Label>Select Your Topics</Label>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {categories.map((category) => (
                 <div key={category.id} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id={category.id}
                        name="categories"
                        value={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="hidden"
                    />
                    <Checkbox
                        id={`${category.id}-visual`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryChange(category.id)}
                    />
                    <Label htmlFor={`${category.id}-visual`} className="cursor-pointer">
                        {category.name}
                    </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
            <SubmitButton />
            {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
        </CardFooter>
      </form>
    </Card>
  );
}