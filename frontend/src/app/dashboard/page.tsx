"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RefreshCw } from "lucide-react";

export default function DashboardDispatcherPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "ADMIN") {
      router.replace("/dashboard/admin");
    } else if (user.role === "SUPPLIER") {
      router.replace("/dashboard/supplier");
    } else {
      router.replace("/dashboard/buyer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Routing to authenticated role dashboard...</span>
      </div>
    </div>
  );
}
