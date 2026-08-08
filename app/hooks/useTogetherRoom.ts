"use client";

import { useEffect, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  togetherRoomAtom,
  userIdAtom,
  isAppLockedAtom,
  pendingTogetherInviteAtom,
  togetherInvitesAtom,
  activeWorkspaceAtom,
} from "../states/States";
import { TogetherRoom, TogetherRoomType, TogetherInvite } from "../states/togetherTypes";
import { getSocket, connectSocket } from "./useSocket";
import { showToast } from "../components/Toast";

/**
 * Custom hook for Together Room socket interactions and deferred room joining.
 * Manages room lifecycle: create, join, leave, close, update state.
 * Syncs room state to the global togetherRoomAtom and manages incoming join & rejoin requests.
 */
export function useTogetherRoom() {
  const [room, setRoom] = useAtom(togetherRoomAtom);
  const [userId] = useAtom(userIdAtom);
  const [isAppLocked] = useAtom(isAppLockedAtom);
  const [pendingInvite, setPendingInvite] = useAtom(pendingTogetherInviteAtom);
  const [invites, setInvites] = useAtom(togetherInvitesAtom);
  const setActiveWorkspace = useSetAtom(activeWorkspaceAtom);

  // Helper to ensure an active, connected socket instance
  const getActiveSocket = useCallback(() => {
    let socket = getSocket();
    if (!socket && userId) {
      socket = connectSocket(userId);
    }
    return socket;
  }, [userId]);

  // Connect socket immediately when userId is available
  useEffect(() => {
    if (userId) {
      connectSocket(userId);
    }
  }, [userId]);

  const dismissInvite = useCallback(
    (roomId: string) => {
      setInvites((prev) => prev.filter((i) => i.roomId !== roomId));
    },
    [setInvites]
  );

  // ─── Join Room Action ───
  const joinRoom = useCallback(
    (roomId: string) => {
      const socket = getActiveSocket();
      if (!socket) return;
      socket.emit("together:join", { roomId });
      dismissInvite(roomId);
      setActiveWorkspace("together");
    },
    [getActiveSocket, setActiveWorkspace, dismissInvite]
  );

  // ─── Fetch Rejoinable Rooms ───
  const fetchRejoinableRooms = useCallback(() => {
    const socket = getActiveSocket();
    if (socket) {
      socket.emit("together:getRejoinableRooms");
    }
  }, [getActiveSocket]);

  // ─── Socket event listeners ───
  useEffect(() => {
    const socket = getActiveSocket();
    if (!socket) return;

    const handleState = (roomState: TogetherRoom | null) => {
      setRoom(roomState);
      if (roomState?.roomId) {
        setInvites((prev) => prev.filter((i) => i.roomId !== roomState.roomId));
      }
    };

    const handleCreated = (roomState: TogetherRoom) => {
      setRoom(roomState);
      if (roomState?.roomId) {
        setInvites((prev) => prev.filter((i) => i.roomId !== roomState.roomId));
      }
    };

    const handleClosed = (data?: { roomId?: string }) => {
      setRoom(null);
      if (data?.roomId) {
        setInvites((prev) => prev.filter((i) => i.roomId !== data.roomId));
      }
    };

    const handleRoomClosed = (data: { roomId: string }) => {
      if (data?.roomId) {
        setInvites((prev) => prev.filter((i) => i.roomId !== data.roomId));
      }
    };

    const handleError = (data: { message: string }) => {
      console.error("Together error:", data.message);
      showToast(data.message || "An error occurred with Together room", "error");
    };

    const handleInviteReceived = (rawInvite: {
      roomId: string;
      roomType: string;
      hostId: string;
      hostUsername: string;
      hostProfilePic?: string;
    }) => {
      // Do NOT process or display invitation for the host themselves
      if (userId && String(rawInvite.hostId) === String(userId)) return;

      const inviteObj: TogetherInvite = {
        ...rawInvite,
        createdAt: Date.now(),
      };
      setInvites((prev) => {
        const filtered = prev.filter((i) => i.roomId !== inviteObj.roomId && (userId ? String(i.hostId) !== String(userId) : true));
        return [inviteObj, ...filtered];
      });
    };

    const handleRejoinableRooms = (rejoinableList: TogetherInvite[]) => {
      if (!Array.isArray(rejoinableList)) return;
      setInvites((prev) => {
        // Exclude any rooms hosted by current user
        const combined = prev.filter((i) => (userId ? String(i.hostId) !== String(userId) : true));
        for (const item of rejoinableList) {
          const isOwnRoom = userId ? String(item.hostId) === String(userId) : false;
          if (!isOwnRoom && !combined.some((i) => i.roomId === item.roomId)) {
            combined.push(item);
          }
        }
        return combined;
      });
    };

    socket.on("together:state", handleState);
    socket.on("together:created", handleCreated);
    socket.on("together:closed", handleClosed);
    socket.on("together:roomClosed", handleRoomClosed);
    socket.on("together:error", handleError);
    socket.on("together:inviteReceived", handleInviteReceived);
    socket.on("together:rejoinableRooms", handleRejoinableRooms);

    // On mount, check room state & fetch available active rooms
    socket.emit("together:getState", { roomId: null });
    socket.emit("together:getRejoinableRooms");

    return () => {
      socket.off("together:state", handleState);
      socket.off("together:created", handleCreated);
      socket.off("together:closed", handleClosed);
      socket.off("together:roomClosed", handleRoomClosed);
      socket.off("together:error", handleError);
      socket.off("together:inviteReceived", handleInviteReceived);
      socket.off("together:rejoinableRooms", handleRejoinableRooms);
    };
  }, [userId, getActiveSocket, setRoom, setInvites]);

  // ─── URL Query Parameter & Deep Link Check ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const joinRoomId = params.get("joinRoom");
    const workspaceParam = params.get("workspace");

    if (joinRoomId || workspaceParam === "together") {
      setActiveWorkspace("together");
    }

    if (joinRoomId) {
      // Remove query param from URL without page refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      if (isAppLocked) {
        setPendingInvite({ roomId: joinRoomId });
      } else {
        joinRoom(joinRoomId);
      }
    }
  }, [isAppLocked, setPendingInvite, joinRoom, setActiveWorkspace]);

  // ─── Handle App Lock Unlock Deferred Redirection ───
  useEffect(() => {
    if (!isAppLocked && pendingInvite) {
      setActiveWorkspace("together");
      joinRoom(pendingInvite.roomId);
      setPendingInvite(null);
    }
  }, [isAppLocked, pendingInvite, joinRoom, setPendingInvite, setActiveWorkspace]);

  // ─── Actions ───

  const createRoom = useCallback(
    (type: TogetherRoomType, gameId?: string, targetUserId?: string) => {
      const socket = getActiveSocket();
      if (!socket) return;
      socket.emit("together:create", { type, gameId, targetUserId });
    },
    [getActiveSocket]
  );

  const emit = useCallback(
    (event: string, data?: any) => {
      const socket = getActiveSocket();
      if (!socket) return;
      socket.emit(event, data);
    },
    [getActiveSocket]
  );

  const leaveRoom = useCallback(() => {
    const socket = getActiveSocket();
    if (!socket || !room) return;
    socket.emit("together:leave", { roomId: room.roomId });
    setRoom(null);
    // Refresh rejoinable rooms list
    fetchRejoinableRooms();
  }, [room, getActiveSocket, setRoom, fetchRejoinableRooms]);

  const closeRoom = useCallback(() => {
    const socket = getActiveSocket();
    if (!socket || !room) return;
    socket.emit("together:close", { roomId: room.roomId });
    setRoom(null);
  }, [room, getActiveSocket, setRoom]);

  const updateState = useCallback(
    (patch: Record<string, unknown>) => {
      const socket = getActiveSocket();
      if (!socket || !room) return;
      socket.emit("together:update", { roomId: room.roomId, patch });
    },
    [room, getActiveSocket]
  );

  const switchGame = useCallback(
    (gameId: string) => {
      const socket = getActiveSocket();
      if (!socket || !room) return;
      socket.emit("together:switchGame", { roomId: room.roomId, gameId });
    },
    [room, getActiveSocket]
  );

  const isHost = room?.hostId === userId;

  return {
    room,
    isHost,
    invites,
    dismissInvite,
    fetchRejoinableRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    switchGame,
    updateState,
    emit,
  };
}
