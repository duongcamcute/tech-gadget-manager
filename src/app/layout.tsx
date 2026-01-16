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
  title: "Tech Gadget Manager",
  description: "Quản lý kho đồ công nghệ cá nhân",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GadgetMgr",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png", // Reusing 192 icon for apple touch for now
  }
};

export const viewport = {
  themeColor: "#ea580c",
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
            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <div className="bg-orange-600 text-white text-xs font-medium py-1 text-center fixed top-0 w-full z-50">
                ⚠️ CHẾ ĐỘ DEMO - Dữ liệu sẽ KHÔNG được lưu lại
              </div>
            )}
            <div className={`flex flex-col min-h-screen ${process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'pt-6' : ''}`}>
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
