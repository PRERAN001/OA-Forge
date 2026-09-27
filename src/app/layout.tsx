import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
<<<<<<< HEAD
=======
import Providers from '@/components/Providers';
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aura OA - Online Technical Assessment Platform',
  description:
    'Customize algorithm questions, difficulty levels, topic tags, points, and randomized mock assessments powered by authentic dataset (2,800+ questions).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
<<<<<<< HEAD
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
=======
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90
      </body>
    </html>
  );
}
