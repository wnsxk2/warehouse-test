'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to companies page
    router.push('/admin/companies');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <p className="text-gray-500">리다이렉트 중...</p>
    </div>
  );
}
