import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Shell from "@/components/Shell";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Namade Kadda - Source Smarter. Manufacture Better.",
  description: "One intelligent workspace for industrial sourcing, supplier discovery and manufacturing procurement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0d11] text-slate-100 min-h-screen antialiased">
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen bg-[#0b0d11]" />}>
            <Shell>{children}</Shell>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
