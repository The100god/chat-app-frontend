"use client";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, userAtom, userIdAtom } from "../states/States";
import { apiFetch } from "../utils/apiFetch";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  login: (token: string, userId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

//AuthProvider Component

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useAtom<User>(userAtom);
  const [, setLoading] = useState<boolean>(true);
  const [, setUserId] = useAtom(userIdAtom);

  const login = useCallback((token: string, userId?: string) => {
    localStorage.setItem("chatAppToken", token);
    if (userId) {
      setUserId(userId);
      localStorage.setItem("chatAppUserId", userId);
    }

    setIsAuthenticated(true);
    router.push("/");
  }, [router, setUserId]);

  const logout = useCallback(() => {
    localStorage.removeItem("chatAppToken");
    setIsAuthenticated(false);
    setUser({} as User);
    router.push("/pages/login");
  }, [router, setUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("chatAppToken", token);
      login(token);
      router.replace("/"); // remove ?token=... from URL
    }
  }, [router, login]);

  const hasCheckedRef = useRef(false);
  useEffect(() => {
    if (hasCheckedRef.current) return;
    const token = localStorage.getItem("chatAppToken");
    if (!token) {
      setLoading(false);
      return;
    }

    hasCheckedRef.current = true;
    //
    apiFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/me`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser({
          username: data.username,
          email: data.email,
          profilePic: data.profilePic,
          about: data.about || "Hey there! I’m using Chugli 💬",
        });
        setUserId(data._id); // 🔥 IMPORTANT: store userId globally
        localStorage.setItem("chatAppUserId", data._id); // optional
      })
      .catch(() => {
        localStorage.removeItem("chatAppToken");
        setUser({} as User);
        setIsAuthenticated(false);
        if (pathname !== "/pages/login" && pathname !== "/pages/signup") {
          router.push("/pages/login");
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, router, setUser, setUserId]);

  //Check if token exist in localstorage on initial load
  useEffect(() => {
    const chatAppToken = localStorage.getItem("chatAppToken");
    if (chatAppToken) {
      setIsAuthenticated(true);
      if (pathname === "/pages/login" || pathname === "/pages/signup") {
        router.push("/"); // Redirect to home if logged in
      }
    } else {
      // Allow access to login and signup pages if no token
      if (pathname !== "/pages/login" && pathname !== "/pages/signup") {
        router.push("/pages/login");
      }
    }
  }, [pathname, router]);



  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
