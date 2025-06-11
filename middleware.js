import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  console.log("🌐 Environment:", process.env.NODE_ENV);
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token',
  });

  console.log("🌐 Browser Token Check:", token ? 'Token exists' : 'Token is null');
  
  // Debug: Log cookie names in production
  if (process.env.NODE_ENV === 'production' && !token) {
    console.log("🌐 Available cookies:", request.cookies.getAll().map(c => c.name));
  }

  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnHrDashboard = pathname.startsWith('/hr_dashboard');

  if ((isOnDashboard || isOnHrDashboard) && !isLoggedIn) {
    console.log("🌐 Redirecting to login - no valid token");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoggedIn && pathname === '/') {
    const redirectPath = token.role === "hrAdmin" ? "/hr_dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|static|_next|.*\\..*).*)', '/'],
};