import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Health Equity & Mentoring Network",
  description: "Gender-sensitive employee engagement, mentoring, and issue resolution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <a
          href="#main-content"
          className="fixed left-4 top-0 z-[100] -translate-y-full rounded-b-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-xl outline-none ring-2 ring-brand transition focus:translate-y-0"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
