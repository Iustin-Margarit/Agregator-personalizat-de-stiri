import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthHeader from "@/components/custom/auth-header";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
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
                <Link href="/saved">Go to your Dashboard</Link>
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
  );
}