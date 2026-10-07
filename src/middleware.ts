import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ req, token }) {
      // The public root route renders LandingPage for signed-out visitors.
      if (req.nextUrl.pathname === '/') return true;
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/signin (Sign-in page)
     * - /api/auth/* (NextAuth API routes)
    * - /api/user/credits (JSON API handles its own unauthenticated response)
     * - /privacy, /terms, /refund-policy, /shipping-policy, /contact, /about (Merchant legal info)
     * - _next/static, _next/image, favicon.ico (Static assets)
     */
    '/((?!auth/signin|api/auth|api/user/credits|privacy|terms|refund-policy|shipping-policy|contact|about|_next/static|_next/image|favicon.ico).*)',
  ],
};
