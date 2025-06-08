'use client';

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function DynamicDashboardLink() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Only add timestamp on client-side navigation
    const timestamp = Date.now();
    router.push(`/dashboard?_t=${timestamp}`);
  }, [router]);
  
  return (
    <Link 
      href="/dashboard" 
      onClick={mounted ? handleClick : undefined}
      className="text-gray-700 hover:text-blue-600"
    >
      Dashboard
    </Link>
  );
}
