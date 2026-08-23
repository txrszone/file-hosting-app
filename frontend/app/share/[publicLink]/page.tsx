'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatFileSize, formatDateLong, getMimeTypeIcon } from '@/lib/utils';
import { Download, Flag, AlertCircle } from 'lucide-react';

interface PublicFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  downloadCount: number;
  canPreview: boolean;
  createdAt: string;
  expiresAt?: string;
}

export default function SharePage() {
  const params = useParams();
  const publicLink = params.publicLink as string;
  const [file, setFile] = useState<PublicFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await api.get(`/api/public/${publicLink}`);
        setFile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'File not found');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [publicLink]);

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);
    try {
      const response = await api.get(`/api/public/${publicLink}/download`);
      window.open(response.data.url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      alert('Please select a report reason');
      return;
    }

    setReportSubmitting(true);
    try {
      await api.post(`/api/files/${publicLink}/report`, {
        reason: reportReason,
        description: reportDescription,
        email: reportEmail,
      });
      alert('Thank you for reporting this file. Our team will review it shortly.');
      setReportModal(false);
      setReportReason('');
      setReportDescription('');
      setReportEmail('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Report submission failed');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">File Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">FileHost</h1>
            <p className="text-gray-600">Secure File Sharing</p>
          </div>

          {file && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">{getMimeTypeIcon(file.mimeType)}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 break-words">
                  {file.originalName}
                </h2>
                <div className="space-y-1 text-gray-600">
                  <p>Size: <span className="font-bold">{formatFileSize(file.size)}</span></p>
                  <p>Downloads: <span className="font-bold">{file.downloadCount}</span></p>
                  <p>Uploaded: <span className="font-bold">{formatDateLong(file.createdAt)}</span></p>
                  {file.expiresAt && (
                    <p>Expires: <span className="font-bold">{formatDateLong(file.expiresAt)}</span></p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
                >
                  <Download className="h-5 w-5" />
                  <span>{downloading ? 'Downloading...' : 'Download File'}</span>
                </button>

                <button
                  onClick={() => setReportModal(true)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
                >
                  <Flag className="h-5 w-5" />
                  <span>Report File</span>
                </button>
              </div>

              {file.canPreview && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-blue-700">
                    📋 Preview available for this file type
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Report File</h3>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  <option value="malware">Malware/Virus</option>
                  <option value="phishing">Phishing</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="illegal">Illegal Content</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Please provide details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setReportModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {reportSubmitting ? 'Submitting...' : 'Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
