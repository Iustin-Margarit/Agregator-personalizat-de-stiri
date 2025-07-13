"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { ColoredAvatar } from '@/components/ui/colored-avatar';
import { Palette } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ProfileForms } from '@/components/custom/profile-forms';
import { updateAvatarColor } from '@/app/actions';
import { useFormState, useFormStatus } from 'react-dom';

type Profile = {
    username: string;
    avatar_color: string;
    banner_color: string;
};

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#DC2626', // Dark Red
  '#059669', // Dark Green
];

function SubmitButton({ children, disabled }: { children: React.ReactNode, disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

export default function ProfilePage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [lastColorUpdateTimestamp, setLastColorUpdateTimestamp] = useState(0);

  const [colorState, colorFormAction] = useFormState(updateAvatarColor, null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // First try with banner_color, if it fails, try without it
        let { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_color, banner_color')
          .eq('id', user.id)
          .single();

        // If banner_color column doesn't exist, try without it
        if (error && error.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('username, avatar_color')
            .eq('id', user.id)
            .single();
          
          if (fallbackError) {
            console.error('Error fetching profile:', fallbackError);
            showToast({ title: 'Error', message: 'Could not fetch your profile.', type: 'error' });
          } else if (fallbackData) {
            // Add default banner_color if missing
            setProfile({
              ...fallbackData,
              banner_color: '#3B82F6'
            });
            setSelectedColor(fallbackData.avatar_color || '#3B82F6');
          }
        } else if (error) {
          console.error('Error fetching profile:', error);
          showToast({ title: 'Error', message: 'Could not fetch your profile.', type: 'error' });
        } else if (data) {
          setProfile(data);
          setSelectedColor(data.avatar_color || '#3B82F6');
        }
      }
      setLoading(false);
    };

    fetchProfile();
    const handleProfileUpdate = () => fetchProfile();
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
        window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    if (colorState?.timestamp && colorState.timestamp > lastColorUpdateTimestamp) {
        setLastColorUpdateTimestamp(colorState.timestamp);
        if (colorState.error) {
            showToast({ title: "Error", message: colorState.error, type: "error" });
        } else if (colorState.success) {
            showToast({ title: "Success", message: "Avatar color updated successfully!", type: "success" });
            window.dispatchEvent(new Event('profileUpdated'));
        }
    }
  }, [colorState, showToast, lastColorUpdateTimestamp]);

  if (loading && !user) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
            <div className="relative w-32 h-32 mx-auto">
                <ColoredAvatar 
                  username={profile?.username} 
                  color={selectedColor} 
                  size="xl" 
                />
                <div className="absolute bottom-0 right-0">
                    <div className="bg-gray-800 text-white p-2 rounded-full">
                        <Palette className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <Card>
              <form action={colorFormAction}>
                <CardHeader>
                  <CardTitle>Avatar Color</CardTitle>
                  <CardDescription>Choose a color for your profile avatar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Select Color</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            selectedColor === color 
                              ? 'border-gray-800 scale-110' 
                              : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                    <input type="hidden" name="color" value={selectedColor} />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <SubmitButton>Update Color</SubmitButton>
                </CardFooter>
              </form>
            </Card>

            <ProfileForms user={user} profile={profile} />
            <Link href="/onboarding" className="mt-4 inline-block w-full">
              <Button variant="outline" className='w-full'>Manage Your Topics</Button>
           </Link>
        </CardContent>
     </Card>
   </div>
  );
}