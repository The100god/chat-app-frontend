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

        // 2. Service Worker Registration Badge API (Required for Mobile Launchers & PWAs)
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
          } catch (err) {
            console.warn("Service Worker setAppBadge error:", err);
          }
        }
      };

      updateBadge();
    }
  }, [totalUnread, isAuthenticated]);

  return null;
}
