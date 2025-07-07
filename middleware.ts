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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Define routes that do not require authentication
  const unprotectedRoutes = ['/login', '/signup', '/forgot-password', '/update-password'];

  // Check if the current path is a protected route
  const isProtectedRoute = !unprotectedRoutes.includes(pathname);

  // Redirect unauthenticated users from protected routes to login
  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to home
  if (session && unprotectedRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/saved';
    return NextResponse.redirect(url);
  }

  // Handle Admin Route Protection
  if (session && pathname.startsWith('/admin')) {
    const { data: isAdmin, error } = await supabase.rpc('is_admin', {
      p_user_id: session.user.id,
    });

    if (error || !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/feed'; // Redirect non-admins to the main feed
      return NextResponse.redirect(url);
    }
  }

  // Handle onboarding redirection
  if (session && pathname !== '/onboarding' && !pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_completed_onboarding')
      .eq('id', session.user.id)
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