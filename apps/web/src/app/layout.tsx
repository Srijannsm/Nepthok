import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "../components/ui/sonner";
import { AuthInitializer } from "../components/shared/AuthInitializer";
import { QueryProvider } from "../components/shared/QueryProvider";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nepthok",
  description: "Nepal's marketplace for mobile accessories",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <AuthInitializer />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
