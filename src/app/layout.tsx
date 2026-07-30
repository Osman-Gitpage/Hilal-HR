import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hilal Office",
    template: "%s — Hilal Office",
  },
  description:
    "Profesyonel çok firmalı İnsan Kaynakları ve Bordro Yönetim Sistemi",

  icons: {
    icon: [
      { url: "/test/fav.png", type: "image/png", sizes: "any" },
    ],
    apple: [
      { url: "/test/fav.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/test/fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
