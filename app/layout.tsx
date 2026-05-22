import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HK Buslines Dashboard",
  description: "Hệ thống quản lý xe buýt HK Buslines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-100">{children}</body>
    </html>
  );
}
