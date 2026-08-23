'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Trash2, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  storage_used: number;
  warning_count: number;
  created_at: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [warningSeverity, setWarningSeverity] = useState('warning');
  const [submitting, setSubmitting] = useState(false);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/api/admin/users');
      return response.data.users;
    },
  });

  const handleWarnUser = async () => {
    if (!selectedUser || !warningReason) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/admin/users/${selectedUser.id}/warn`, {
        reason: warningReason,
        severity: warningSeverity,
      });
      alert('User warned successfully');
      setShowWarningModal(false);
      setWarningReason('');
      setWarningSeverity('warning');
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to warn user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, {
        status: newStatus,
      });
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts, roles, and status</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users?.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status}
                        onChange={(e) => handleChangeStatus(user.id, e.target.value)}
                        className={`px-3 py-1 rounded text-xs font-medium border-0 ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={user.warning_count > 0 ? 'font-bold text-red-600' : ''}>
                        {user.warning_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowWarningModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-700"
                        title="Warn user"
                      >
                        <ShieldAlert className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Warn User</h3>
            <p className="text-gray-600 mb-6">User: {selectedUser.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Reason for warning..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={warningSeverity}
                  onChange={(e) => setWarningSeverity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="warning">Warning</option>
                  <option value="suspension">Suspension (7 days)</option>
                  <option value="ban">Ban</option>
                </select>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    setWarningReason('');
                    setWarningSeverity('warning');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWarnUser}
                  disabled={submitting}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {submitting ? 'Submitting...' : 'Warn User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
