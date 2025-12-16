import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DC Tour Planner | Mapbox MCP + Mastra',
  description: 'Plan your perfect Washington, DC tour with AI-powered route optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
