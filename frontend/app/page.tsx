'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">FileHost</h1>
            <p className="text-xl text-gray-600 mb-2">Secure File Hosting & Sharing</p>
            <p className="text-gray-500">Upload, share, and manage your files with ease</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">✓ Secure file uploads</li>
                <li className="flex items-center">✓ Public sharing links</li>
                <li className="flex items-center">✓ File expiration control</li>
                <li className="flex items-center">✓ Download tracking</li>
                <li className="flex items-center">✓ File previews</li>
                <li className="flex items-center">✓ Advanced security</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 flex flex-col justify-center">
              <p className="text-gray-600 mb-6 text-center">
                Get started with secure file hosting today
              </p>
              <Link
                href="/auth/register"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center mb-3"
              >
                Sign Up
              </Link>
              <Link
                href="/auth/login"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg text-center"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="border-t pt-8">
            <p className="text-center text-gray-500 text-sm">
              © 2024 FileHost. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
