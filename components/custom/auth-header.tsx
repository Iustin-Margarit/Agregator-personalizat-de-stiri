"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColoredAvatar } from "@/components/ui/colored-avatar";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";

type Profile = {
  username: string | null;
  avatar_color: string | null;
};

export default function AuthHeader({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_color')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
          Manage Topics
        </Link>
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className={`hover:text-gray-300 ${pathname.startsWith('/admin') ? 'text-yellow-300 font-semibold' : ''}`}
          >
            Admin Panel
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <ColoredAvatar
                username={profile?.username}
                color={profile?.avatar_color || '#3B82F6'}
                size="md"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.username}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            <ThemeToggle />
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-500 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white"
            >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}