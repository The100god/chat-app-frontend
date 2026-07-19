"use client";

import { useAuth } from "./context/AuthContext";
import ResizableLayout from "./components/ResizableLayout"; // Import ResizableLayout
import LeftSection from "./pages/leftSection/page";
import ChatArea from "./pages/chatAreas/page";
// import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  // const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Register PWA service worker (only in production; clean up in development)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.startsWith("192.168.") ||
        process.env.NODE_ENV === "development"
      ) {
        // Unregister service worker in local dev
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("Cleaned up Service Worker registration for development.");
              }
            });
          }
        });
        // Clear all caches in local dev to resolve ChunkLoadError from previous caches
        if ("caches" in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name).then(() => {
                console.log("Cleared cache:", name);
              });
            }
          });
        }
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered scope:", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err));
      }
    }
  }, []);
  // useEffect(() => {
  // if (!isAuthenticated) {
  //   // router.push("/login"); // redirect to login
  //   return null;
  // }
  // }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="text-[var(--foreground)] p-4">Redirecting...</div>; // loading fallback
  }

  return (
    <div className="flex w-full" style={{ height: "calc(100vh - 112px)" }}>
      <ResizableLayout
        leftComponent={<LeftSection />}
        rightComponent={<ChatArea />}
      />
    </div>
  );
}
