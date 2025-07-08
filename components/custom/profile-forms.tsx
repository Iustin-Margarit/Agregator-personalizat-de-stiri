"use client";

import { useEffect, useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { PasswordStrength } from "@/components/ui/password-strength";
import { InfoModal } from '@/components/ui/info-modal';
import { updateUsername, updateUserEmail, updateUserPassword, updateBannerColor } from "@/app/actions";
import type { User } from "@supabase/supabase-js";
import { ColorPicker } from '@/components/ui/color-picker';

interface ProfileFormsProps {
  user: User | null;
  profile: {
    username: string;
    banner_color?: string;
  } | null;
}

type BannerColorState = {
  error: string;
  timestamp: number;
  success?: undefined;
} | {
  success: boolean;
  error: null;
  timestamp: number;
} | null;


const BANNER_PRESET_COLORS = [
  {
    name: 'Ocean Blue',
    value: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
  },
  {
    name: 'Sunset Red', 
    value: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  },
  {
    name: 'Forest Green',
    value: '#10B981', 
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  {
    name: 'Golden Amber',
    value: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  {
    name: 'Royal Purple',
    value: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
  }
];

function SubmitButton({ children, disabled }: { children: React.ReactNode, disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

export function ProfileForms({ user, profile }: ProfileFormsProps) {
  const { showToast } = useToast();

  const [usernameState, usernameFormAction] = useFormState(updateUsername, null);
  const [emailState, emailFormAction] = useFormState(updateUserEmail, null);
  const [passwordState, passwordFormAction] = useFormState(updateUserPassword, null);
  const [bannerColorState, bannerColorFormAction] = useFormState(updateBannerColor, null);

  const [lastUsernameTimestamp, setLastUsernameTimestamp] = useState(0);
  const [lastEmailTimestamp, setLastEmailTimestamp] = useState(0);
  const [lastPasswordTimestamp, setLastPasswordTimestamp] = useState(0);
  const [lastBannerColorTimestamp, setLastBannerColorTimestamp] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [newEmailForModal, setNewEmailForModal] = useState('');

  const [selectedBannerColor, setSelectedBannerColor] = useState(profile?.banner_color || BANNER_PRESET_COLORS[0].value);

  useEffect(() => {
    if (usernameState?.timestamp && usernameState.timestamp > lastUsernameTimestamp) {
        setLastUsernameTimestamp(usernameState.timestamp);
        if (usernameState.error) {
            showToast({ title: "Error", message: usernameState.error, type: "error" });
        } else if (usernameState.success) {
            showToast({ title: "Success", message: "Username updated successfully!", type: "success" });
            window.dispatchEvent(new Event('profileUpdated'));
        }
    }
  }, [usernameState, showToast, lastUsernameTimestamp]);

  useEffect(() => {
    if (emailState?.timestamp && emailState.timestamp > lastEmailTimestamp) {
      setLastEmailTimestamp(emailState.timestamp);
      if (emailState.error) {
        showToast({ title: "Error", message: emailState.error, type: "error" });
      } else if (emailState.success) {
        const newEmail = (document.getElementById('newEmail') as HTMLInputElement)?.value;
        setNewEmailForModal(newEmail);
        setIsInfoModalOpen(true);
      }
    }
  }, [emailState, showToast, lastEmailTimestamp]);

  useEffect(() => {
    if (passwordState?.timestamp && passwordState.timestamp > lastPasswordTimestamp) {
        setLastPasswordTimestamp(passwordState.timestamp);
        if (passwordState.error) {
            showToast({ title: 'Error', message: passwordState.error, type: 'error' });
        } else if (passwordState.success) {
            showToast({ title: 'Success', message: 'Password updated successfully!', type: 'success' });
            setNewPassword('');
        }
    }
  }, [passwordState, showToast, lastPasswordTimestamp]);

  useEffect(() => {
    if (bannerColorState?.timestamp && bannerColorState.timestamp > lastBannerColorTimestamp) {
        setLastBannerColorTimestamp(bannerColorState.timestamp);
        if (bannerColorState.error) {
            showToast({ title: "Error", message: bannerColorState.error, type: "error" });
        } else if (bannerColorState.success) {
            showToast({ title: "Success", message: "Banner color updated successfully!", type: "success" });
            window.dispatchEvent(new Event('bannerColorUpdated'));
            window.dispatchEvent(new Event('profileUpdated'));
        }
    }
  }, [bannerColorState, showToast, lastBannerColorTimestamp]);

  const getSelectedColorName = () => {
    const presetColor = BANNER_PRESET_COLORS.find(c => c.value === selectedBannerColor);
    return presetColor ? presetColor.name : selectedBannerColor;
  };

  return (
    <div className="space-y-4">
      <Card>
        <form action={usernameFormAction}>
          <CardHeader>
            <CardTitle>Username</CardTitle>
            <CardDescription>This is your public display name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input type="text" id="username" name="username" defaultValue={profile?.username ?? ""} required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton>Update Username</SubmitButton>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <form action={bannerColorFormAction}>
          <CardHeader>
            <CardTitle>Banner Color</CardTitle>
            <CardDescription>Customize the color of the website's top banner.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Select Color</Label>
              <div className="flex items-center gap-2">
                {BANNER_PRESET_COLORS.map((colorObj) => (
                  <button
                    key={colorObj.value}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedBannerColor === colorObj.value
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ background: colorObj.gradient }}
                    onClick={() => setSelectedBannerColor(colorObj.value)}
                    aria-label={`Select color ${colorObj.name}`}
                    title={colorObj.name}
                  />
                ))}
                <ColorPicker
                  value={selectedBannerColor}
                  onChange={setSelectedBannerColor}
                  showPresets={false}
                  size="sm"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Current selection: <span className="font-semibold" style={{ color: selectedBannerColor }}>{getSelectedColorName()}</span>
              </p>
              <input type="hidden" name="color" value={selectedBannerColor} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton>Update Banner Color</SubmitButton>
          </CardFooter>
        </form>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex flex-col items-start">
              <span className="font-semibold">Email Address</span>
              <span className="text-sm font-normal text-muted-foreground">Used for login and notifications.</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <form action={emailFormAction}>
              <CardContent className="space-y-4 pt-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label>Current Email</Label>
                  <Input type="email" value={user?.email ?? ""} readOnly disabled />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input type="email" id="newEmail" name="newEmail" placeholder="new.email@example.com" required />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <SubmitButton>Change Email</SubmitButton>
              </CardFooter>
            </form>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
            <AccordionTrigger>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Password</span>
                  <span className="text-sm font-normal text-muted-foreground">Manage your password settings.</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <form action={passwordFormAction}>
                    <CardContent className="space-y-4 pt-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                            type="password" 
                            id="newPassword"
                            name="newPassword" 
                            required 
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <PasswordStrength password={newPassword} onStrengthChange={setIsPasswordStrong} />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input type="password" id="confirmPassword" name="confirmPassword" required minLength={8}/>
                    </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <SubmitButton disabled={!isPasswordStrong}>Update Password</SubmitButton>
                    </CardFooter>
                </form>
            </AccordionContent>
        </AccordionItem>
      </Accordion>

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Confirm Your Email Change"
      >
        <div className="space-y-4">
            <p>To finalize your email change, please complete the following two steps:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>
                    Go to your <strong>new email inbox</strong> for{' '}
                    <span className="font-semibold text-blue-600">{newEmailForModal}</span> and click the
                    confirmation link.
                </li>
                <li>
                    Then, go to your <strong>old email inbox</strong> and click the second
                    confirmation link to finalize the change.
                </li>
            </ol>
            <p className="text-sm text-gray-500">
                This two-step process is a security measure to ensure your account remains safe.
            </p>
        </div>
      </InfoModal>
    </div>
  );
}