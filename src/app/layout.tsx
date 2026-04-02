import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "黄金价格追踪器 | Gold Price Tracker",
  description: "实时黄金现货/期货价格、新闻、投资分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
