// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Get the JWT token, passing the configured secret
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  console.log("🌐 Browser Token Check:", token);

  
  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  // Define protected routes
  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnHrDashboard = pathname.startsWith('/hr_dashboard');

  // Protect dashboard routes
  if ((isOnDashboard || isOnHrDashboard) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users from home page based on role
  if (isLoggedIn && pathname === '/') {
    const redirectPath = token.role === "hrAdmin" ? "/hr_dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|static|_next|.*\\..*).*)', '/'],
};