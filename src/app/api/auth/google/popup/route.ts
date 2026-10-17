import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const script = `
    window.opener?.postMessage(
      { type: 'google-sign-in-complete' },
      ${JSON.stringify(origin)}
    );
    window.close();
  `;

  return new NextResponse(
    `<!doctype html><html><head><title>Sign-in complete</title></head><body><script>${script}</script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}
