import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";

import AppLockWrapper from "./components/AppLockWrapper";
import UnreadBadgeManager from "./components/UnreadBadgeManager";
import ToastContainer from "./components/Toast";
import TogetherInviteToast from "./components/TogetherInviteToast";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0aa38c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Chugli",
  description: 'Chugli - Built with Next.js, TypeScript, and Tailwind CSS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden h-dvh`}
      >
        <AuthProvider>
          <AppLockWrapper>
            <UnreadBadgeManager />
            <Header />
            <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
              {children}
            </main>
            <Footer />
            <ToastContainer />
            <TogetherInviteToast />
          </AppLockWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
