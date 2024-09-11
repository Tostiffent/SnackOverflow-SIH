"use client";
import "./globals.css";
import React from "react";

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
