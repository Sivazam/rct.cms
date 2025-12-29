import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for all admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    console.log('Middleware: Skipping authentication for admin route:', pathname);
    return NextResponse.next();
  }

  // All other authentication logic for non-admin routes can remain here if needed
  
  return NextResponse.next();
}