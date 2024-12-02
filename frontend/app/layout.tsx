"use client";
import "./globals.css";
import React from "react";
import { ReduxProvider } from "@/redux/ReduxProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <main className="flex items-center justify-center min-h-screen">
          <ReduxProvider>
            <GoogleOAuthProvider
              clientId={`568541926291-c822nidma6977gon1vnrnv1hj3fmu16v.apps.googleusercontent.com`}
            >
              {children}
            </GoogleOAuthProvider>
          </ReduxProvider>
        </main>
      </body>
    </html>
  );
}
