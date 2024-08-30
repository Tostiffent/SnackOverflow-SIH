import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Login - Spectra',
  description: 'Sign in to your Spectra account.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <main className="flex items-center justify-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
