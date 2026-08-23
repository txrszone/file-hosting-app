'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { BarChart3, Users, FileText, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  userStorageUsed: number;
  pendingReports: number;
  recentDownloads: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    },
  });

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, files, and system settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.totalUsers}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Files</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.totalFiles}
              </p>
            </div>
            <FileText className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Reports</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.pendingReports}
              </p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-4">Manage users, roles, and account status</p>
          <Link
            href="/admin-panel/users"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Manage Users
          </Link>
        </div>

        {/* Report Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Reports</h2>
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-gray-600 mb-4">Review and handle reported files</p>
          <Link
            href="/admin-panel/reports"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            View Reports
          </Link>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-gray-600 mb-4">View system and admin activity logs</p>
          <Link
            href="/admin-panel/audit-logs"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            View Logs
          </Link>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <p className="text-gray-600 mb-4">Configure system-wide settings</p>
          <Link
            href="/admin-panel/settings"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
