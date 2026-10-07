import OACustomizer from '@/components/OACustomizer';
import LandingPage from './LandingPage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <OACustomizer />
    </main>
  );
}

