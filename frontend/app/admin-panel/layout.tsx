'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">FileHost Admin</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/admin-panel" className="text-gray-600 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <Link href="/admin-panel/users" className="text-gray-600 hover:text-gray-900 font-medium">
                  Users
                </Link>
                <Link href="/admin-panel/reports" className="text-gray-600 hover:text-gray-900 font-medium">
                  Reports
                </Link>
                <Link href="/admin-panel/audit-logs" className="text-gray-600 hover:text-gray-900 font-medium">
                  Audit Logs
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                User Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
