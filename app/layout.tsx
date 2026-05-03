import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

import { AuthProvider } from "@/context/auth-context";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "A production-ready collaborative task manager for project teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} min-h-screen bg-slate-50 font-sans text-slate-950`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            theme="light"
            toastOptions={{
              className: "border border-slate-200"
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
