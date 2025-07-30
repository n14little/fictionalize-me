import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthProvider } from './providers';
import AuthButtons from '@/components/AuthButtons';
import DynamicDashboardLink from '@/components/DynamicDashboardLink';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fictionalize Me',
  description: 'Your personal journal with a creative twist',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="font-bold text-xl text-blue-600">
                  Fictionalize Me
                </Link>
              </div>
              <nav className="flex space-x-4 sm:space-x-6 items-center">
                <Link
                  href="/waitlist"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Waitlist
                </Link>
                <Link
                  href="/journals"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Journals
                </Link>
                <DynamicDashboardLink />
                <div className="flex-shrink-0">
                  <AuthProvider>
                    <AuthButtons />
                  </AuthProvider>
                </div>
              </nav>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col">
          {children}
          <div id="modal-root"></div>
        </div>
        <footer className="bg-white border-t border-gray-200 py-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Fictionalize Me. All rights
              reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
