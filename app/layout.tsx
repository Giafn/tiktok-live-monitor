import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TikTok Live Monitor',
  description: 'Monitor TikTok live chat in real-time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="noise">
        <div className="mesh-bg" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
