'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';

export default function AuthListener() {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // On initial load and sign-in, the session is available.
      if (session) {
        setLoading(true); // Show loader while middleware redirects
      } else {
        setLoading(false); // No session, no loader needed
      }

      // Hide loader when navigation is complete
      // This is a bit of a workaround for Next.js App Router
      const hideLoader = () => setLoading(false);
      // We can't use next/router events, so we use a small timeout
      setTimeout(hideLoader, 500);
    });

    // Also handle the initial page load
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading your session...</p>
      </div>
    </div>
  );
}