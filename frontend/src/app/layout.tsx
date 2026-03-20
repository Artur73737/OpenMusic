import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Music MCP Studio',
  description: 'AI-powered polyphonic piano composition studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
