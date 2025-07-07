"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Upload, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ProfileForms } from '@/components/custom/profile-forms';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { removeAvatar } from '@/app/actions';

type Profile = {
    username: string;
    avatar_url: string;
};

export default function ProfilePage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lastRemovalTimestamp, setLastRemovalTimestamp] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          showToast({ title: 'Error', message: 'Could not fetch your profile.', type: 'error' });
        } else if (data) {
          setProfile(data);
          setAvatarUrl(data.avatar_url || '');
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

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    if (!user) return;

    const file = event.target.files[0];
    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        showToast({ title: 'Invalid File Type', message: 'Please upload a PNG or JPG image.', type: 'error' });
        return;
    }
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        showToast({ title: 'File Too Large', message: 'Please upload an image smaller than 2MB.', type: 'error' });
        return;
    }

    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
    });

    if (uploadError) {
      showToast({ title: 'Upload Error', message: `Failed to upload avatar: ${uploadError.message}`, type: 'error' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

    if (updateError) {
        showToast({ title: 'Error', message: 'Could not save new avatar.', type: 'error' });
    } else {
        setAvatarUrl(publicUrl);
        showToast({ title: 'Success', message: 'Avatar updated!', type: 'success' });
        // Dispatch event to notify header
        window.dispatchEvent(new Event('profileUpdated'));
    }
    
    setUploading(false);
  };

  const handleRemoveClick = async () => {
    setIsRemoving(true);
    const result = await removeAvatar();
    if (result.timestamp > lastRemovalTimestamp) {
        setLastRemovalTimestamp(result.timestamp);
        if (result.error) {
            showToast({ title: 'Error', message: result.error, type: 'error' });
        } else {
            showToast({ title: 'Success', message: 'Avatar removed successfully!', type: 'success' });
            setAvatarUrl('');
            window.dispatchEvent(new Event('profileUpdated'));
        }
    }
    setIsRemoving(false);
    setIsModalOpen(false);
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading && !user) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
            <div className="relative w-32 h-32 mx-auto">
                <Avatar className="w-full h-full text-4xl">
                    <AvatarImage src={avatarUrl} alt={profile?.username} key={avatarUrl} />
                    <AvatarFallback>{getInitials(profile?.username)}</AvatarFallback>
                </Avatar>
                 <div className="absolute bottom-0 right-0 flex gap-1">
                    <label htmlFor="avatar-upload" className="bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-gray-700">
                        <Upload className="h-5 w-5" />
                        <input id="avatar-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={uploadAvatar} disabled={uploading}/>
                    </label>
                    {avatarUrl && (
                        <Button variant="destructive" size="icon" className="h-9 w-9 p-2 rounded-full" onClick={() => setIsModalOpen(true)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
            {uploading && <p className="text-sm mt-2">Uploading...</p>}
        </CardHeader>
        <CardContent>
            <ProfileForms user={user} profile={profile} />
            <Link href="/onboarding" className="mt-4 inline-block w-full">
              <Button variant="outline" className='w-full'>Manage Your Topics</Button>
           </Link>
        </CardContent>
     </Card>
     <ConfirmationModal
       isOpen={isModalOpen}
       onClose={() => setIsModalOpen(false)}
       onConfirm={handleRemoveClick}
       title="Remove Profile Picture"
       description="Are you sure you want to remove your profile picture?"
       confirmText="Remove"
       variant="destructive"
       isLoading={isRemoving}
     />
   </div>
  );
}