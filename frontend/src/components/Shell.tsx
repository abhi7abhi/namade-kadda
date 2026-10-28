"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DemoBanner from "@/components/DemoBanner";
import WelcomeModal from "@/components/WelcomeModal";
import ProductTour from "@/components/ProductTour";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  if (isPublicPage) {
    return <main className="min-h-screen bg-[#0b0d11]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0b0d11]">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 w-full transition-all duration-200">
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <DemoBanner />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Onboarding & Tour Modals for Workspace */}
      <WelcomeModal />
      <ProductTour />
    </div>
  );
}
