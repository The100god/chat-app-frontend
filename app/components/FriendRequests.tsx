"use client";
import { useState, useEffect } from "react";
import ScaleTN from "./ScaleTN";
import { useSocket } from "../hooks/useSocket";
import { useAtom } from "jotai";
import { userIdAtom } from "../states/States";

const FriendRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [userId] = useAtom(userIdAtom);
  const socket = useSocket(userId);

  useEffect(() => {
    if (!userId || !socket) return;

    // 🔄 Fetch initial friend requests from DB via socket
    socket.emit("getFriendRequests", { userId });
    socket.emit("getSentFriendRequestsDetailed", { userId });

    // 📥 Set initial list of incoming friend requests
    const handleFriendRequestsList = (data: any[]) => {
      setRequests(data);
      setLoading(false);
    };

    // 📥 Set initial list of sent (outgoing) friend requests
    const handleSentRequestsList = (data: any[]) => {
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
    const handleFriendRequestSent = ({ receiverId }: { receiverId: string }) => {
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
    <div className="p-4 bg-[var(--background)] text-[var(--foreground)] shadow-md rounded-md w-[90%]">
      <h2 className="text-lg font-semibold mb-3">Friend Requests</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
            activeTab === "received"
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--foreground)]/30 hover:border-[var(--accent)]"
          }`}
        >
          Received {requests.length > 0 && `(${requests.length})`}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
            activeTab === "sent"
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--foreground)]/30 hover:border-[var(--accent)]"
          }`}
        >
          Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
        </button>
      </div>

      {/* Received Requests Tab */}
      {activeTab === "received" && (
        <>
          {loading ? (
            <ScaleTN rows={3} />
          ) : requests.length === 0 ? (
            <p className="text-[var(--foreground)]/50 text-sm">No new friend requests.</p>
          ) : (
            requests?.map((req) => (
              <div
                key={req?._id}
                className="flex justify-between items-center bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] cursor-pointer transition duration-200 p-2 rounded-md mb-2"
              >
                <div className="flex flex-row gap-2 items-center">
                  <span className="flex border border-[var(--accent)] rounded-full w-8 h-8 p-[1px] justify-center items-center">
                    <img
                      className="flex rounded-full border-2 border-[var(--accent)] w-full h-full"
                      src={req?.profilePic}
                      alt="pic"
                    />
                  </span>
                  <p>{req?.username}</p>
                </div>
                <div>
                  <button
                    className="bg-[var(--accent)] cursor-pointer text-[var(--foreground)] px-2 py-1 rounded-md mr-2"
                    onClick={() => handleResponse(req?._id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 cursor-pointer text-white px-2 py-1 rounded-md"
                    onClick={() => handleResponse(req?._id, "declined")}
                  >
                    Reject
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
            <p className="text-[var(--foreground)]/50 text-sm">No pending sent requests.</p>
          ) : (
            sentRequests.map((req) => (
              <div
                key={req?._id}
                className="flex justify-between items-center bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] cursor-pointer transition duration-200 p-2 rounded-md mb-2"
              >
                <div className="flex flex-row gap-2 items-center">
                  <span className="flex border border-[var(--accent)] rounded-full w-8 h-8 p-[1px] justify-center items-center">
                    <img
                      className="flex rounded-full border-2 border-[var(--accent)] w-full h-full object-cover"
                      src={req?.profilePic}
                      alt="pic"
                    />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{req?.username}</p>
                    <span className="text-xs text-yellow-500 font-semibold">⏳ Pending</span>
                  </div>
                </div>
                <button
                  className="bg-red-500/80 hover:bg-red-600 cursor-pointer text-white px-2 py-1 rounded-md text-sm"
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
  );
};

export default FriendRequests;
