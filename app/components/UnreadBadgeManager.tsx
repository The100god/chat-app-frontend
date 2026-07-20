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

    // Request initial friend list with unread counts
    socket.emit("getFriendListWithUnseen", { userId });

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdate);
      socket.off("unreadMessageCountUpdated", handleUnseenCountUpdate);
      socket.off("update_unseen_count", handleUnseenCountUpdate);
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
    if (typeof window !== "undefined" && "navigator" in window) {
      const nav = navigator as any;
      if ("setAppBadge" in nav) {
        if (currentCount > 0) {
          nav.setAppBadge(currentCount).catch((err: unknown) => {
            console.warn("App Badge API (setAppBadge) error:", err);
          });
        } else if ("clearAppBadge" in nav) {
          nav.clearAppBadge().catch((err: unknown) => {
            console.warn("App Badge API (clearAppBadge) error:", err);
          });
        }
      }
    }
  }, [totalUnread, isAuthenticated]);

  return null;
}
