'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{session.user.name}</span>
        <Link
          href="/auth/logout"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Logout
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      Login
    </Link>
  );
} 