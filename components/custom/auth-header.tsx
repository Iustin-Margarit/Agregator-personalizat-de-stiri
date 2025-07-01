"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      router.push("/login");
    }
  };

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1 className="text-2xl font-bold">
        <Link href="/" className="hover:text-gray-300">
          Personalized News Aggregator
        </Link>
      </h1>
      <nav className="flex items-center gap-4">
        <Link 
          href="/feed" 
          className={`hover:text-gray-300 ${pathname === '/feed' ? 'text-blue-300 font-semibold' : ''}`}
        >
          News Feed
        </Link>
        <Link 
          href="/saved" 
          className={`hover:text-gray-300 ${pathname === '/saved' ? 'text-blue-300 font-semibold' : ''}`}
        >
          Saved Articles
        </Link>
        <Link 
          href="/onboarding" 
          className={`hover:text-gray-300 ${pathname === '/onboarding' ? 'text-blue-300 font-semibold' : ''}`}
        >
          Topics
        </Link>
        <Button onClick={handleSignOut} variant="outline" className="text-black">
          Logout
        </Button>
      </nav>
    </header>
  );
}