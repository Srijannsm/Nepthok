import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepthok",
  description: "Multi-tenant SaaS Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
