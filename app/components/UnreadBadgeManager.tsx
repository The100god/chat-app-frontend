"use client";

import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useAuth } from "../context/AuthContext";
import { connectSocket } from "../hooks/useSocket";
import {
  friendsAtom,
  unreadCountAtom,
  updateAvailableAtom,
  userIdAtom,
  Friend,
} from "../states/States";
import { showToast } from "./Toast";
import { apiFetch } from "../utils/apiFetch";

export default function UnreadBadgeManager() {
  const { isAuthenticated } = useAuth();
  const [userId] = useAtom(userIdAtom);
  const [, setFriends] = useAtom(friendsAtom);
  const totalUnread = useAtomValue(unreadCountAtom);
  const [, setUpdateAvailable] = useAtom(updateAvailableAtom);

  // Service Worker & App Update Detection
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const checkUpdates = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            setUpdateAvailable(true);
            showToast("✨ A new update is available! Go to Settings to apply.", "info", 6000);
          }
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  showToast("✨ A new update is available! Go to Settings to apply.", "info", 6000);
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn("SW update check error:", err);
      }
    };

    checkUpdates();
  }, [setUpdateAvailable]);

  // 1. Real-time Socket Listener for Unread Messages & Friends Updates
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const socket = connectSocket(userId);
    if (!socket) return;

    const handleFriendsUpdate = (updatedFriends: Friend[]) => {
      if (Array.isArray(updatedFriends)) {
        setFriends(updatedFriends);
      }
    };

    const handleUnseenCountUpdate = ({
      friendId,
      count,
    }: {
      friendId: string;
      count: number;
    }) => {
      setFriends((prevFriends) => {
        const friendExists = prevFriends.some((f) => f.friendId === friendId);
        if (!friendExists) {
          // If friend not found in local list yet, fetch full list from socket
          socket.emit("getFriendListWithUnseen", { userId });
          return prevFriends;
        }
        return prevFriends.map((friend) =>
          friend.friendId === friendId
            ? { ...friend, unreadMessagesCount: Math.max(0, count) }
            : friend
        );
      });
    };

    socket.on("friendsUpdated", handleFriendsUpdate);
    socket.on("unreadMessageCountUpdated", handleUnseenCountUpdate);
    socket.on("update_unseen_count", handleUnseenCountUpdate);

    // Request Notification permission on mount if default (required for iOS Safari PWA badging)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Request initial friend list with unread counts
    socket.emit("getFriendListWithUnseen", { userId });

    // Refresh unread count on visibility change (mobile app resume / tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        socket.emit("getFriendListWithUnseen", { userId });
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdate);
      socket.off("unreadMessageCountUpdated", handleUnseenCountUpdate);
      socket.off("update_unseen_count", handleUnseenCountUpdate);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isAuthenticated, userId, setFriends]);

  // 2. Real-time App Icon Badge & Browser Tab Title Synchronization
  useEffect(() => {
    const baseTitle = "Chugli";
    const currentCount = isAuthenticated ? totalUnread : 0;

    // Web Version: Update browser tab title
    if (currentCount > 0) {
      document.title = `(${currentCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Installed Mobile/PWA/Desktop Apps: Update Platform App Icon Badge API
    if (typeof window !== "undefined") {
      const updateBadge = async () => {
        // 1. Direct Navigator API
        const nav = navigator as any;
        if ("setAppBadge" in nav) {
          try {
            if (currentCount > 0) {
              await nav.setAppBadge(currentCount);
            } else if ("clearAppBadge" in nav) {
              await nav.clearAppBadge();
            }
          } catch (err) {
            console.warn("Direct navigator.setAppBadge error:", err);
          }
        }

        // 2. Service Worker Registration & Notification Badge API (Required for Mobile Launchers & PWAs)
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && "setAppBadge" in reg) {
              if (currentCount > 0) {
                await (reg as any).setAppBadge(currentCount);
              } else if ("clearAppBadge" in reg) {
                await (reg as any).clearAppBadge();
              }
            }

            // Also post message to active Service Worker to execute setAppBadge inside sw.js
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "SET_BADGE",
                count: currentCount,
              });
            }

            // 3. Trigger native notification to force Android & iOS launcher badge overlay
            if (
              reg &&
              "Notification" in window &&
              Notification.permission === "granted" &&
              currentCount > 0
            ) {
              reg.showNotification("Chugli Chat", {
                body: `You have ${currentCount} unread message${currentCount > 1 ? "s" : ""}`,
                icon: "/icon-192.png",
                badge: "/icon-192.png",
                tag: "chugli-unread-badge",
                silent: true,
              }).catch(() => {});
            } else if (reg && currentCount === 0) {
              reg.getNotifications({ tag: "chugli-unread-badge" }).then((nots) => {
                nots.forEach((n) => n.close());
              }).catch(() => {});
            }
          } catch (err) {
            console.warn("Service Worker setAppBadge error:", err);
          }
        }
      };

      updateBadge();
    }
  }, [totalUnread, isAuthenticated]);

  // 3. Register Web Push subscription with the backend
  useEffect(() => {
    if (!isAuthenticated) return;

    const registerPush = async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        if (!reg.pushManager) {
          console.warn("Push manager is not supported on this browser.");
          return;
        }

        // Get VAPID public key from env or backend (use env first, fallback to API)
        let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const response = await fetch(`${apiBase}/api/users/vapid-public-key`);
            const data = await response.json();
            vapidKey = data.publicKey;
          } catch (e) {
            console.error("Failed to fetch VAPID key from backend:", e);
          }
        }

        if (!vapidKey) {
          console.error("VAPID public key is missing.");
          return;
        }

        // Only request subscription if permission is granted
        if (Notification.permission !== "granted") {
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
        
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe the user
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }

        // Send the subscription to backend
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        await apiFetch(`${apiBase}/api/users/subscribe`, {
          method: "POST",
          body: JSON.stringify({ subscription }),
        });
      } catch (err) {
        console.error("Error registering Web Push subscription:", err);
      }
    };

    // Delay registration slightly to avoid blocking main thread on mount
    const timeoutId = setTimeout(() => {
      registerPush();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  return null;
}

// Utility to convert VAPID public key to Uint8Array required by subscribe options
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
