import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // This is the recommended way to handle authentication in Next.js middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define routes that do not require authentication
  const unprotectedRoutes = ['/login', '/signup', '/forgot-password', '/update-password'];

  // Redirect unauthenticated users from protected routes to login
  if (!user && !unprotectedRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to the main feed
  if (user && unprotectedRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/feed';
    return NextResponse.redirect(url);
  }

  // Handle Admin Route Protection
  if (user && pathname.startsWith('/admin')) {
    const { data: isAdmin, error } = await supabase.rpc('is_admin', {
      p_user_id: user.id,
    });

    if (error || !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/feed'; // Redirect non-admins to the main feed
      return NextResponse.redirect(url);
    }
  }

  // Handle onboarding redirection for authenticated, non-admin users
  if (user && !pathname.startsWith('/admin') && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_completed_onboarding')
      .eq('id', user.id)
      .single();

    if (profile && !profile.has_completed_onboarding) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};