import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToasterProvider } from "@/components/ToasterProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Best Cut Admin",
  description: "Admin dashboard for managing Best Cut barber applications",
};

import { ThemeProvider } from "@/context/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToasterProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
