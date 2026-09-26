import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  // Redirect /api/auth/google/callback to NextAuth's standard callback route /api/auth/callback/google
  url.pathname = '/api/auth/callback/google';
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/api/auth/callback/google';
  return NextResponse.redirect(url, 307);
}
