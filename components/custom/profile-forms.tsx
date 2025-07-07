"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { PasswordStrength } from "@/components/ui/password-strength";
import { InfoModal } from '@/components/ui/info-modal';
import { updateUsername, updateUserEmail, updateUserPassword } from "@/app/actions";
import type { User } from "@supabase/supabase-js";

interface ProfileFormsProps {
  user: User | null;
  profile: {
    username: string;
  } | null;
}

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

  const [lastUsernameTimestamp, setLastUsernameTimestamp] = useState(0);
  const [lastEmailTimestamp, setLastEmailTimestamp] = useState(0);
  const [lastPasswordTimestamp, setLastPasswordTimestamp] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [newEmailForModal, setNewEmailForModal] = useState('');

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