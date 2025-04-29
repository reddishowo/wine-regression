import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wine Regression Dashboard",
  description: "A minimal dashboard for wine quality regression analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-white text-gray-900`}
      >
        <main className="min-h-screen p-6">
          {children}
        </main>
      </body>
    </html>
  );
}