'use client';

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InfoModal } from "@/components/ui/info-modal";
import type { Session } from '@supabase/supabase-js';

export default function Home() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [session, setSession] = useState<Session | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: '' });

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        checkSession();
    }, [supabase.auth]);

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            if (message.includes('Please proceed to confirm link sent to the other email')) {
                 setModalContent({
                    title: 'One More Step!',
                    body: 'Thank you for confirming your new email. To finalize the change, please click the confirmation link sent to your other email address (your old one). This is a security step to ensure your account remains safe.'
                });
                setIsModalOpen(true);
            } else if (message.includes('Email updated successfully')) {
                setModalContent({
                    title: 'Email Changed Successfully!',
                    body: 'Your email address has been updated. You will be logged out for security purposes. Please log in again with your new email address.'
                });
                setIsModalOpen(true);
                const timer = setTimeout(async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                }, 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [searchParams, supabase.auth, router]);

  return (
    <>
        <InfoModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalContent.title}
        >
            <p>{modalContent.body}</p>
        </InfoModal>

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-full max-w-2xl mx-auto text-center p-8">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to the Personalized News Aggregator
            </h1>
            {session ? (
              <div className="space-y-4">
                <p className="text-lg">You are logged in.</p>
                <div className="flex justify-center gap-4">
                  <Button asChild>
                    <Link href="/feed">Go to Your News Feed</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/saved">Saved Articles</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">
                  Your one-stop shop for news tailored to your interests.
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
    </>
  );
}