import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/signin (Sign-in page)
     * - /api/auth/* (NextAuth API routes)
     * - /privacy, /terms, /refund-policy, /shipping-policy, /contact, /about (Merchant legal info)
     * - _next/static, _next/image, favicon.ico (Static assets)
     */
    '/((?!auth/signin|api/auth|privacy|terms|refund-policy|shipping-policy|contact|about|_next/static|_next/image|favicon.ico).*)',
  ],
};
