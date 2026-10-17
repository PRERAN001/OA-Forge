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
  secret: process.env.NEXTAUTH_SECRET || 'roundzero_oa_nextauth_secret_key_2026',
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
        const rawEmail = session.user.email || (token.email as string);
        if (rawEmail) {
          const normEmail = rawEmail.trim().toLowerCase();
          session.user.email = normEmail;
          // Sync logged-in user with MongoDB database and retrieve live credits status
          const dbUser = await syncUserWithMongoDB(
            normEmail,
            session.user.name || undefined,
            session.user.image || undefined
          );
          if (dbUser) {
            (session.user as any).credits = dbUser.isUnlimited
              ? Math.max(dbUser.credits ?? 1, 999)
              : (dbUser.credits ?? 1);
            (session.user as any).isUnlimited = !!dbUser.isUnlimited;
            (session.user as any).unlimitedExpiry = dbUser.unlimitedExpiry
              ? new Date(dbUser.unlimitedExpiry).toISOString()
              : undefined;
            (session.user as any).potdStreak = dbUser.potdStreak || 0;
            (session.user as any).potdLastSolvedDate = dbUser.potdLastSolvedDate;
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.email) {
          token.email = user.email.trim().toLowerCase();
        }
      }
      return token;
    },
  },
};
