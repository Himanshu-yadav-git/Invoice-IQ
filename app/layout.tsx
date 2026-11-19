import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuSmart AI | Intelligent Document Processing',
  description:
    'DocuSmart AI — Automate invoice extraction, validation, and approval with intelligent document processing powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#04071a] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
