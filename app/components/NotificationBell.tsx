"use client"
import { useEffect, useState } from "react";
// import { Bell } from "lucide-react"; // Using Lucide Icons
import { getSocket, connectSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";

const NotificationBell = () => {

const [requestCount, setRequestCount] = useState(0);
const [userId] = useAtom(userIdAtom);
  useEffect(() => {
    if (!userId) return;

    connectSocket(userId); // 🔌 Join socket room

    const socket = getSocket();

    //Initial fetch from server via socket
    socket?.emit("getFriendRequests", { userId });

    // When server sends the full friend requests list
    const handleFriendRequestsList = (data: unknown[]) => {
      if (Array.isArray(data)) {
        setRequestCount(data.length);
      }
    };

    // When a new friend request is received
    const handleNewFriendRequest = () => {
      setRequestCount((prev) => prev + 1);
    };

    // When user accepts or declines a request
    const handleRequestHandled = () => {
      setRequestCount((prev) => Math.max(prev - 1, 0));
    };

    socket?.on("friendRequestsList", handleFriendRequestsList);
    socket?.on("friendRequestReceived", handleNewFriendRequest);
    socket?.on("friendRequestAccepted", handleRequestHandled);
    socket?.on("friendRequestDenied", handleRequestHandled);

    return () => {
      socket?.off("friendRequestsList", handleFriendRequestsList);
      socket?.off("friendRequestReceived", handleNewFriendRequest);
      socket?.off("friendRequestAccepted", handleRequestHandled);
      socket?.off("friendRequestDenied", handleRequestHandled);
    };
  }, [userId]);

  if (requestCount <= 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center bg-rose-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] h-4.5 leading-none shadow-xs animate-pulse">
      {requestCount}
    </span>
  );
};

export default NotificationBell;
