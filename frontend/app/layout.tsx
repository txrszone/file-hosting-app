import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FileHost - Secure File Sharing',
  description: 'Secure file hosting and sharing platform',
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
