'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { WalletContextProvider } from '@/components/WalletProvider';
import Navbar from '@/components/Navbar';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1 }
    }
  }));

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SuratEstate — Next-Gen Real Estate Platform</title>
        <meta name="description" content="Find your dream property in Surat, Gujarat. Buy, rent, and invest with AI-powered insights and blockchain verification." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryClientProvider client={queryClient}>
            <WalletContextProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Toaster position="top-right" toastOptions={{
                className: 'font-sans',
                duration: 4000,
                style: { borderRadius: '12px', padding: '12px 16px' }
              }} />
            </WalletContextProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
