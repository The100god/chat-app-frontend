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
