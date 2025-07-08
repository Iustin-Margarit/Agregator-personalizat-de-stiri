import AuthHeader from "@/components/custom/auth-header";
import { ThemeProvider } from "@/components/custom/theme-provider";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>
            <AuthHeader isAdmin={isAdmin} />
            {/* Main layout with nav, sidebar will go here */}
            <main>{children}</main>
        </div>
    </ThemeProvider>
  );
}