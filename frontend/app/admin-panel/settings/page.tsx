'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';

interface SystemSettings {
  [key: string]: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get('/api/admin/settings');
      setSettings(response.data);
      return response.data;
    },
  });

  const handleSetting = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/api/admin/settings', {
        key,
        value: settings[key],
      });
      setMessage(`✓ ${key} updated successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`✗ Failed to update ${key}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure application-wide settings</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.startsWith('✓')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleSetting(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() => handleSave(key)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
