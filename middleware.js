import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token',
  });

  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  const isOnDashboard = pathname.startsWith('/dashboard/private');
  const isOnHrDashboard = pathname.startsWith('/hr_dashboard');

  if ((isOnDashboard || isOnHrDashboard) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoggedIn && pathname === '/') {
    const expectedPath = token.role === "hrAdmin" ? "/hr_dashboard" : "/dashboard/private";
    return NextResponse.redirect(new URL(expectedPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/hr_dashboard/:path*'],
};
