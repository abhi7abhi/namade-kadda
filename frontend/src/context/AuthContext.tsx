"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  login: (emailOrId: string, password: string, rememberMe?: boolean, role?: string) => Promise<User>;
  adminLogin: (adminId: string, password: string) => Promise<User>;
  logout: (redirectTo?: string) => Promise<void>;
  registerBuyer: (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    business_category?: string;
    sourcing_categories?: string[] | string;
    contact_phone?: string;
  }) => Promise<{ user: User; redirect_url?: string }>;
  registerSupplier: (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    products_sold?: string;
    product_categories?: string[] | string;
    manufacturing_capabilities?: string;
    contact_phone: string;
  }) => Promise<{ user: User; redirect_url?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Monotonic epoch counter to cancel and ignore any in-flight requests on logout
  const sessionEpoch = useRef(0);

  const initAuth = async () => {
    const currentEpoch = sessionEpoch.current;
    try {
      const storedToken = localStorage.getItem("nk_auth_token");
      if (storedToken) {
        setToken(storedToken);
        const me = await api.getCurrentUser();
        // Verify session epoch has not changed and token was not cleared during fetch
        if (currentEpoch === sessionEpoch.current && localStorage.getItem("nk_auth_token") === storedToken) {
          setUser(me);
        }
      }
    } catch {
      // Token invalid or expired
      if (currentEpoch === sessionEpoch.current) {
        try {
          localStorage.removeItem("nk_auth_token");
          localStorage.removeItem("nk_user_role");
        } catch {}
        setToken(null);
        setUser(null);
      }
    } finally {
      if (currentEpoch === sessionEpoch.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (emailOrId: string, password: string, rememberMe?: boolean, role?: string) => {
    setIsLoading(true);
    try {
      const isNumeric = /^\d+$/.test(emailOrId.trim());
      const payload: { email?: string; admin_id?: string; password: string; role?: string; remember_me?: boolean } = {
        password,
        role,
        remember_me: rememberMe
      };

      if (isNumeric && role === "ADMIN") {
        payload.admin_id = emailOrId.trim();
      } else {
        payload.email = emailOrId.trim();
      }

      const res = await api.login(payload);
      setToken(res.access_token);
      setUser(res.user);
      try {
        localStorage.setItem("nk_auth_token", res.access_token);
        localStorage.setItem("nk_user_role", res.user.role);
      } catch {}
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (adminId: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.adminLogin({ admin_id: adminId.trim(), password });
      setToken(res.access_token);
      setUser(res.user);
      try {
        localStorage.setItem("nk_auth_token", res.access_token);
        localStorage.setItem("nk_user_role", res.user.role);
      } catch {}
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerBuyer = async (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    business_category?: string;
    sourcing_categories?: string[] | string;
    contact_phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerBuyer(data);
      setToken(res.access_token);
      setUser(res.user);
      try {
        localStorage.setItem("nk_auth_token", res.access_token);
        localStorage.setItem("nk_user_role", res.user.role);
      } catch {}
      return { user: res.user, redirect_url: res.redirect_url };
    } finally {
      setIsLoading(false);
    }
  };

  const registerSupplier = async (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    products_sold?: string;
    product_categories?: string[] | string;
    manufacturing_capabilities?: string;
    contact_phone: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerSupplier(data);
      setToken(res.access_token);
      setUser(res.user);
      try {
        localStorage.setItem("nk_auth_token", res.access_token);
        localStorage.setItem("nk_user_role", res.user.role);
      } catch {}
      return { user: res.user, redirect_url: res.redirect_url };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fast, responsive, and secure logout flow:
   * 1. Disables UI controls to prevent duplicate clicks.
   * 2. Increments sessionEpoch to cancel/ignore any in-flight auth responses.
   * 3. Immediately clears local React state and token storage.
   * 4. Immediately routes the user to the public homepage (or specified target).
   * 5. Completes server-side session cleanup with a strict timeout guard.
   */
  const logout = async (redirectTo: string = "/") => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("nk_auth_token") : null);

    sessionEpoch.current += 1;

    try {
      localStorage.removeItem("nk_auth_token");
      localStorage.removeItem("nk_user_role");
    } catch {}

    setToken(null);
    setUser(null);

    try {
      router.replace(redirectTo);
    } catch (navErr) {
      console.warn("[Auth] Router navigation fallback:", navErr);
    }

    try {
      await api.logout(currentToken);
    } catch (err) {
      console.warn("[Auth] Backend session cleanup note:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const refreshUser = async () => {
    const currentEpoch = sessionEpoch.current;
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("nk_auth_token") : null;
    if (!token && !storedToken) return;
    try {
      const me = await api.getCurrentUser();
      if (currentEpoch === sessionEpoch.current && localStorage.getItem("nk_auth_token")) {
        setUser(me);
      }
    } catch (err) {
      console.warn("Could not refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoggingOut,
        isAuthenticated: !!user,
        login,
        adminLogin,
        logout,
        registerBuyer,
        registerSupplier,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
