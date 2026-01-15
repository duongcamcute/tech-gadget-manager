import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Switched to Inter as per design
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"], // Added vietnamese subset
});

import Footer from "@/components/Footer";
import AuthWrapper from "@/components/auth/AuthWrapper";

// ... existing imports

export const metadata: Metadata = {
  title: "TechGadget Manager",
  description: "Trợ lý quản lý kho đồ công nghệ cá nhân",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background`} suppressHydrationWarning>
        <AuthWrapper>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
