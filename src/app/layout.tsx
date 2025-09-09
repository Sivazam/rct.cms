import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Cremation Management - Rotary Charitable Trust",
  description: "Comprehensive cremation management system for Rotary Charitable Trust with ash pot storage, renewals, and delivery management.",
  keywords: ["Cremation Management", "Rotary Charitable Trust", "Ash Pot Storage", "SCM System", "Funeral Management"],
  authors: [{ name: "Rotary Charitable Trust" }],
  openGraph: {
    title: "Smart Cremation Management",
    description: "Rotary Charitable Trust - Comprehensive cremation management system",
    url: "https://rctscm01.firebaseapp.com",
    siteName: "SCM System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Cremation Management",
    description: "Rotary Charitable Trust - Comprehensive cremation management system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
