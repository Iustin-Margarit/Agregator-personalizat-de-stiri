"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Same preset colors as in profile-forms for consistency
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

export function BannerColorProvider({ 
  children, 
  initialColor = '#3B82F6' 
}: { 
  children: React.ReactNode;
  initialColor?: string;
}) {
  const [bannerColor, setBannerColor] = useState(initialColor);
  const supabase = createClient();

  // Helper function to get the appropriate background value (gradient if preset, solid color if custom)
  const getBannerBackground = (colorValue: string) => {
    const presetColor = BANNER_PRESET_COLORS.find(c => c.value === colorValue);
    return presetColor ? presetColor.gradient : colorValue;
  };

  useEffect(() => {
    // Fetch initial banner color
    const fetchInitialBannerColor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('banner_color')
          .eq('id', user.id)
          .single();
        
        if (profile?.banner_color) {
          setBannerColor(profile.banner_color);
        }
      }
    };

    // Listen for banner color updates
    const handleBannerColorUpdate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('banner_color')
          .eq('id', user.id)
          .single();
        
        if (profile?.banner_color) {
          setBannerColor(profile.banner_color);
        }
      }
    };

    // Fetch initial color on mount
    fetchInitialBannerColor();

    // Listen for custom events
    window.addEventListener('bannerColorUpdated', handleBannerColorUpdate);
    window.addEventListener('profileUpdated', handleBannerColorUpdate);

    return () => {
      window.removeEventListener('bannerColorUpdated', handleBannerColorUpdate);
      window.removeEventListener('profileUpdated', handleBannerColorUpdate);
    };
  }, [supabase]);

  return (
    <div style={{ 
      '--banner-color': bannerColor,
      '--banner-background': getBannerBackground(bannerColor)
    } as React.CSSProperties}>
      {children}
    </div>
  );
}
