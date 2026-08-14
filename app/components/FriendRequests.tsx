"use client";
import { useState, useEffect } from "react";
import ScaleTN from "./ScaleTN";
import { connectSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";
import Image from "next/image";

interface FriendRequest {
  _id: string;
  username: string;
  profilePic: string;
}

const FriendRequests = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [userId] = useAtom(userIdAtom);
  const socket = connectSocket(userId);

  useEffect(() => {
    if (!userId || !socket) return;

    // 🔄 Fetch initial friend requests from DB via socket
    socket.emit("getFriendRequests", { userId });
    socket.emit("getSentFriendRequestsDetailed", { userId });

    // 📥 Set initial list of incoming friend requests
    const handleFriendRequestsList = (data: FriendRequest[]) => {
      setRequests(data);
      setLoading(false);
    };

    // 📥 Set initial list of sent (outgoing) friend requests
    const handleSentRequestsList = (data: FriendRequest[]) => {
      setSentRequests(data);
    };

    // 📥 Real-time new friend request received
    const handleNewFriendRequest = ({
      senderId,
      username,
      profilePic,
    }: {
      senderId: string;
      username: string;
      profilePic: string;
    }) => {
      // Avoid duplicates if already in list
      setRequests((prev) => {
        if (prev.some((req) => req._id === senderId)) return prev;
        return [...prev, { _id: senderId, username, profilePic }];
      });
    };

    // ✅ Friend Request Accepted
    const handleAccepted = ({ receiverId }: { receiverId: string }) => {
      // console.log("✅ Your friend request was accepted by", receiverId);
      // Remove from sent requests
      setSentRequests((prev) => prev.filter((req) => req._id !== receiverId));
    };

    // ❌ Friend Request Denied
    const handleDenied = ({ receiverId }: { receiverId: string }) => {
      // console.log("❌ Your friend request was denied by", receiverId);
      // Remove from sent requests
      setSentRequests((prev) => prev.filter((req) => req._id !== receiverId));
    };

    // When we send a new request, add it to sent list in real-time
    const handleFriendRequestSent = () => {
      // Re-fetch sent requests for fresh data
      socket.emit("getSentFriendRequestsDetailed", { userId });
    };

    socket.on("friendRequestsList", handleFriendRequestsList);
    socket.on("sentFriendRequestsDetailedList", handleSentRequestsList);
    socket.on("friendRequestReceived", handleNewFriendRequest);
    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRequestDenied", handleDenied);
    socket.on("friendRequestSent", handleFriendRequestSent);

    return () => {
      socket.off("friendRequestsList", handleFriendRequestsList);
      socket.off("sentFriendRequestsDetailedList", handleSentRequestsList);
      socket.off("friendRequestReceived", handleNewFriendRequest);
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRequestDenied", handleDenied);
      socket.off("friendRequestSent", handleFriendRequestSent);
    };
  }, [userId, socket]);

  const handleResponse = async (
    senderId: string,
    action: "accept" | "declined"
  ) => {
    if (userId && socket) {
      socket.emit("handleFriendRequest", {
        senderId,
        receiverId: userId,
        status: action === "accept" ? "accepted" : "declined",
      });

      // Remove the handled request from UI
      setRequests((prev) => prev.filter((req) => req._id !== senderId));
    }
  };

  const handleCancelRequest = (receiverId: string) => {
    if (userId && socket) {
      socket.emit("cancelFriendRequest", {
        senderId: userId,
        receiverId,
      });
      setSentRequests((prev) => prev.filter((req) => req._id !== receiverId));
    }
  };

  return (
    <div className="bg-[var(--card)] text-[var(--foreground)] h-full w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col shadow-xs p-4">
      <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-3">
        <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Friend Requests</h2>

        {/* WhatsApp Pill Tabs */}
        <div className="flex bg-[var(--muted)] p-1 rounded-full border border-[var(--border)] gap-1">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
              activeTab === "received"
                ? "bg-[var(--accent)] text-white shadow-2xs"
                : "text-[var(--foreground)] opacity-70 hover:opacity-100"
            }`}
          >
            Received {requests.length > 0 && `(${requests.length})`}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
              activeTab === "sent"
                ? "bg-[var(--accent)] text-white shadow-2xs"
                : "text-[var(--foreground)] opacity-70 hover:opacity-100"
            }`}
          >
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {/* Received Requests Tab */}
        {activeTab === "received" && (
          <>
            {loading ? (
              <ScaleTN rows={3} />
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-[var(--foreground)]/50 text-xs">
                No new friend requests
              </div>
            ) : (
              requests?.map((req) => (
                <div
                  key={req?._id}
                  className="flex items-center justify-between bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-xl p-3 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Image
                      className="rounded-full border border-[var(--border)] w-10 h-10 object-cover shadow-2xs flex-shrink-0"
                      src={req?.profilePic || "/default-profile-pic.jpg"}
                      alt="pic"
                      width={40}
                      height={40}
                    />
                    <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                      {req?.username}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      className="bg-[var(--accent)] hover:opacity-90 cursor-pointer text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition"
                      onClick={() => handleResponse(req?._id, "accept")}
                    >
                      Accept
                    </button>
                    <button
                      className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold transition"
                      onClick={() => handleResponse(req?._id, "declined")}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Sent Requests Tab */}
        {activeTab === "sent" && (
          <>
            {sentRequests.length === 0 ? (
              <div className="text-center py-12 text-[var(--foreground)]/50 text-xs">
                No pending sent requests
              </div>
            ) : (
              sentRequests.map((req) => (
                <div
                  key={req?._id}
                  className="flex items-center justify-between bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-xl p-3 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Image
                      className="rounded-full border border-[var(--border)] w-10 h-10 object-cover shadow-2xs flex-shrink-0"
                      src={req?.profilePic || "/default-profile-pic.jpg"}
                      alt="pic"
                      width={40}
                      height={40}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                        {req?.username}
                      </p>
                      <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <span>⏳</span> Pending response
                      </span>
                    </div>
                  </div>
                  <button
                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0"
                    onClick={() => handleCancelRequest(req?._id)}
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
