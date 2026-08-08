"use client";

import { useAuth } from "./context/AuthContext";
import ResizableLayout from "./components/ResizableLayout";
import LeftSection from "./pages/leftSection/page";
import ChatArea from "./pages/chatAreas/page";
import TogetherWorkspace from "./components/TogetherWorkspace";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { activeWorkspaceAtom } from "./states/States";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useAtom(activeWorkspaceAtom);

  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Register PWA service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  // Handle URL query parameters, localStorage persistence, and Service Worker notification navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkNavigation = () => {
      const params = new URLSearchParams(window.location.search);
      const workspaceParam = params.get("workspace");
      const joinRoomParam = params.get("joinRoom");

      if (workspaceParam === "together" || joinRoomParam) {
        setActiveWorkspace("together");
        localStorage.setItem("activeWorkspace", "together");
      } else if (workspaceParam === "chat") {
        setActiveWorkspace("chat");
        localStorage.setItem("activeWorkspace", "chat");
      } else {
        const storedWorkspace = localStorage.getItem("activeWorkspace") as "chat" | "together" | null;
        if (storedWorkspace === "together" || storedWorkspace === "chat") {
          setActiveWorkspace(storedWorkspace);
        }
      }
    };

    checkNavigation();

    // Listen for Service Worker postMessages when notification is clicked
    if ("serviceWorker" in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "NAVIGATE_WORKSPACE") {
          if (event.data.workspace === "together" || event.data.roomId) {
            setActiveWorkspace("together");
            localStorage.setItem("activeWorkspace", "together");
          } else if (event.data.workspace === "chat") {
            setActiveWorkspace("chat");
            localStorage.setItem("activeWorkspace", "chat");
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
  }, [setActiveWorkspace]);

  // Sync activeWorkspace to localStorage & URL query parameters whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("activeWorkspace", activeWorkspace);

    const url = new URL(window.location.href);
    if (url.searchParams.get("workspace") !== activeWorkspace) {
      url.searchParams.set("workspace", activeWorkspace);
      window.history.replaceState({}, "", url.toString());
    }
  }, [activeWorkspace]);

  if (!isAuthenticated) {
    return <div className="text-[var(--foreground)] p-4">Redirecting...</div>;
  }

  return (
    <div className="flex w-full" style={{ height: "calc(100vh - 112px)" }}>
      {activeWorkspace === "chat" ? (
        <ResizableLayout
          leftComponent={<LeftSection />}
          rightComponent={<ChatArea />}
        />
      ) : (
        <TogetherWorkspace />
      )}
    </div>
  );
}
