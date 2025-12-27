'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/runs');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse">
        <div className="h-16 w-16 rounded-2xl bg-eva-primary flex items-center justify-center">
          <span className="text-3xl font-bold text-white">E</span>
        </div>
      </div>
    </div>
  );
}
