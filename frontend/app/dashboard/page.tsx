'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { File as FileIcon, Trash2, Copy, Share2, Download } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  publicLink: string;
  isPublic: boolean;
  expiresAt?: string;
  downloadCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [expiresIn, setExpiresIn] = useState('7d');
  const [uploading, setUploading] = useState(false);

  // Fetch user files
  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const response = await api.get('/api/files/my-files');
      return response.data.files;
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('expiresIn', expiresIn);

        await api.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      refetch();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [expiresIn, refetch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  });

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/api/files/${fileId}`);
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    }
  };

  const handleCopyLink = (link: string) => {
    const url = `${window.location.origin}/share/${link}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await api.get(`/api/files/${fileId}/download`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed');
    }
  };

  const files: FileItem[] = filesData || [];

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Files</h2>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">
            {isDragActive
              ? 'Drop your files here'
              : 'Drag and drop files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Maximum file size: 5GB
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Expiration
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="unlimited">Never Expire</option>
          </select>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            My Files ({files.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.downloadCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.expiresAt ? formatDate(file.expiresAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleCopyLink(file.publicLink)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Copy sharing link"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Storage Usage</h3>
        <div className="space-y-2">
          <p className="text-gray-600">
            Used: <span className="font-bold">{formatFileSize(user?.storage_used || 0)}</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  ((user?.storage_used || 0) / (5 * 1024 * 1024 * 1024)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
