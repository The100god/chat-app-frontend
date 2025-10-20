/* eslint "@typescript-eslint/no-explicit-any": "error" */
"use client"
import { useEffect, useState } from "react";
// import { Bell } from "lucide-react"; // Using Lucide Icons
import { useSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";
interface FriendRequest {
  _id: string;
  username: string;
  profilePic: string;
}
const NotificationBell = () => {

const [requestCount, setRequestCount] = useState(0);
const [userId] = useAtom(userIdAtom);
  const socket = useSocket(userId); // ✅ moved to top-level

  useEffect(() => {
    if (!userId || !socket) return;
    //Initial fetch from server via socket
    socket?.emit("getFriendRequests", { userId });

    // When server sends the full friend requests list
    const handleFriendRequestsList = (data: FriendRequest[]) => {
      setRequestCount(data.length);
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
  }, [userId, socket]);

  return (
    <div className="relative">
      {/* <Bell size={24} className="cursor-pointer" /> */}
      {requestCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {requestCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
