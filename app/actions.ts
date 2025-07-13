'use server';

import { revalidatePath } from 'next/cache';

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
  
  const { error } = await supabase.from('profiles').update({ username: username }).eq('id', user.id);

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

export async function updateAvatarColor(
    prevState: any,
    formData: FormData
): Promise<ActionResponse> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to update your profile.', timestamp: Date.now() };
    }

    const color = formData.get('color') as string;

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!color || !hexColorRegex.test(color)) {
        return { success: false, error: 'Please select a valid color.', timestamp: Date.now() };
    }

    const { error } = await supabase.from('profiles').update({ avatar_color: color }).eq('id', user.id);

    if (error) {
        console.error('Error updating avatar color:', error);
        return { success: false, error: 'Failed to update avatar color. Please try again.', timestamp: Date.now() };
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

    // Get current profile to check existing username
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    let finalUsername = username?.trim() || currentProfile?.username || '';

    // If no username provided and no existing username, create one from email
    if (!finalUsername) {
        const emailPrefix = user.email?.split('@')[0] || '';
        finalUsername = emailPrefix.length >= 3 ? emailPrefix : `${emailPrefix}123`;
    }

    if (finalUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters long.', timestamp: Date.now() };
    }
    
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            has_completed_onboarding: true,
            username: finalUsername,
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
export async function updateBannerColor(prevState: any, formData: FormData) {
    const color = formData.get('color') as string;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to update your banner color.", timestamp: Date.now() };
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return { error: "Invalid color format.", timestamp: Date.now() };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ banner_color: color })
        .eq('id', user.id);

    if (error) {
        // If banner_color column doesn't exist, return a helpful error
        if (error.code === '42703') {
            return { error: "Banner color feature is not available yet. Database needs to be updated.", timestamp: Date.now() };
        }
        return { error: "Could not update banner color.", timestamp: Date.now() };
    }

    revalidatePath('/(main)', 'layout');
    revalidatePath('/(main)/profile', 'page');
    revalidatePath('/profile', 'page');
    return { success: true, error: null, timestamp: Date.now() };
}