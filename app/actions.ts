'use server';

import { revalidatePath } from 'next/cache';
import DOMPurify from 'dompurify';

type ActionResponse = {
  success: boolean;
  error: string | null;
  timestamp: number;
};

export async function revalidateSavedAndOnboardingPages() {
  revalidatePath('/saved');
  revalidatePath('/onboarding');
}

export async function updateUsername(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to update your profile.', timestamp: Date.now() };
  }

  const username = formData.get('username') as string;

  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.', timestamp: Date.now() };
  }
  
  const sanitizedUsername = DOMPurify.sanitize(username);

  if (sanitizedUsername !== username) {
      return { success: false, error: 'Username contains invalid characters.', timestamp: Date.now() };
  }

  const { error } = await supabase.from('profiles').update({ username: sanitizedUsername }).eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
       return { success: false, error: 'Username is already taken.', timestamp: Date.now() };
    }
    console.error('Error updating username:', error);
    return { success: false, error: 'Failed to update username. Please try again.', timestamp: Date.now()  };
  }

  revalidatePath('/profile');
  return { success: true, error: null, timestamp: Date.now() };
}

export async function updateUserEmail(
    prevState: any,
    formData: FormData
  ): Promise<ActionResponse> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const newEmail = formData.get('newEmail') as string;
  
    if (!newEmail) {
      return { success: false, error: 'New email address cannot be empty.', timestamp: Date.now() };
    }
  
    const { data, error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}` }
    );
      
    if (error) {
      console.error('Error updating email:', error);
      if (error.message.includes('already been registered')) {
        return { success: false, error: 'This email address is already in use by another account.', timestamp: Date.now()  };
      }
      return { success: false, error: 'Failed to update email. Please try again.', timestamp: Date.now() };
    }
  
    return { success: true, error: null, timestamp: Date.now() };
}

export async function updateUserPassword(
    prevState: any,
    formData: FormData
  ): Promise<ActionResponse> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
  
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.', timestamp: Date.now() };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.', timestamp: Date.now() };
    }
  
    const { error } = await supabase.auth.updateUser({ password: newPassword });
  
    if (error) {
      console.error('Error updating password:', error);
      return { success: false, error: 'Failed to update password. Please try again.', timestamp: Date.now() };
    }
  
    return { success: true, error: null, timestamp: Date.now() };
}

export async function removeAvatar(): Promise<ActionResponse> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to update your profile.', timestamp: Date.now() };
    }

    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);

    if (error) {
        console.error('Error removing avatar:', error);
        return { success: false, error: 'Failed to remove avatar. Please try again.', timestamp: Date.now() };
    }

    revalidatePath('/profile');
    return { success: true, error: null, timestamp: Date.now() };
}

export async function completeOnboarding(
    prevState: any,
    formData: FormData
): Promise<ActionResponse> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to complete onboarding.', timestamp: Date.now() };
    }

    const username = formData.get('username') as string;
    const selectedCategories = formData.getAll('categories') as string[];

    if (!username || username.trim().length < 3) {
        return { success: false, error: 'Username must be at least 3 characters long.', timestamp: Date.now() };
    }
    
    const sanitizedUsername = DOMPurify.sanitize(username.trim());

    if (sanitizedUsername !== username.trim()) {
        return { success: false, error: 'Username contains invalid characters.', timestamp: Date.now() };
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            has_completed_onboarding: true,
            username: sanitizedUsername,
        })
        .eq('id', user.id);

    if (profileError) {
        if (profileError.code === '23505') {
            return { success: false, error: 'This username is already taken. Please choose another.', timestamp: Date.now() };
        }
        console.error('Error updating profile during onboarding:', profileError);
        return { success: false, error: 'Failed to update your profile. Please try again.', timestamp: Date.now() };
    }

    const { error: deleteError } = await supabase
        .from('user_preferred_categories')
        .delete()
        .eq('user_id', user.id);

    if (deleteError) {
        console.error('Error deleting old preferences:', deleteError);
        return { success: false, error: 'Failed to clear old preferences. Please try again.', timestamp: Date.now() };
    }

    if (selectedCategories.length > 0) {
        const preferencesToInsert = selectedCategories.map((categoryId) => ({
            user_id: user.id,
            category_id: categoryId,
        }));

        const { error: insertError } = await supabase
            .from('user_preferred_categories')
            .insert(preferencesToInsert);

        if (insertError) {
            console.error('Error inserting new preferences:', insertError);
            return { success: false, error: 'Failed to save your preferences. Please try again.', timestamp: Date.now() };
        }
    }

    revalidatePath('/onboarding');
    revalidatePath('/feed');

    return { success: true, error: null, timestamp: Date.now() };
}