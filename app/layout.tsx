import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/lib/redux/providers";
import { AuthProvider } from "@/lib/firebase/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "YouTube Bot Manager",
  description: "Manage your YouTube video bot with advanced tracking and notifications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
