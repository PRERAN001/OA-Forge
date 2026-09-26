import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { syncUserWithMongoDB } from './dbServices';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'aura_oa_nextauth_secret_key_2026',
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
        if (session.user.email) {
          // Sync logged-in user with MongoDB database
          syncUserWithMongoDB(session.user.email, session.user.name || undefined, session.user.image || undefined);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};
