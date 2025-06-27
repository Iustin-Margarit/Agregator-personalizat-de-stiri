'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateSavedAndOnboardingPages() {
  revalidatePath('/saved');
  revalidatePath('/onboarding');
}