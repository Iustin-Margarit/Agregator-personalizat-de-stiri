import AuthHeader from "@/components/custom/auth-header";
import { ThemeProvider } from "@/components/custom/theme-provider";
import { BannerColorProvider } from "@/components/custom/banner-color-provider";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  let bannerColor = '#3B82F6'; // Default color

  if (user) {
    // Try to get profile with banner_color, fallback if column doesn't exist
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, banner_color')
        .eq('id', user.id)
        .single();
        
      if (error && error.code === '42703') {
        // banner_color column doesn't exist, just get role
        const { data: roleData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        isAdmin = roleData?.role === 'admin';
        // Keep default banner color
      } else if (profile) {
        isAdmin = profile?.role === 'admin';
        if (profile?.banner_color) {
          bannerColor = profile.banner_color;
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Continue with defaults
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BannerColorProvider initialColor={bannerColor}>
        <div className="bg-[var(--banner-color)]">
          <AuthHeader isAdmin={isAdmin} />
        </div>
        {/* Main layout with nav, sidebar will go here */}
        <main>{children}</main>
      </BannerColorProvider>
    </ThemeProvider>
  );
}