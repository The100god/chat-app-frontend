"use client";
// FindUser.tsx (Search and Send Friend Request)
import React, { useEffect, useState } from "react";
import { getSocket, connectSocket } from "../hooks/useSocket";
import { userIdAtom } from "../states/States";
import { useAtom } from "jotai";
import Image from "next/image";
import { getApiUrl } from "../utils/apiUrl";

interface UserSearchResult {
  _id: string;
  username: string;
  profilePic: string;
}

let debounceTimeout: NodeJS.Timeout;

// Function to search users by username (returns all users if search query is empty)
const searchUsers = async (username: string, userId: string | null) => {
  const apiUrl = getApiUrl();
  const response = await fetch(
    `${apiUrl}/api/users/search?username=${encodeURIComponent(username)}&userId=${userId}`
  );
  return await response.json();
};

const FindUser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const [userId] = useAtom(userIdAtom);

  useEffect(() => {
    if (userId) {
      connectSocket(userId); // Connect and emit 'join'
    }
  }, [userId]);

  // Fetch already-sent requests on mount so we can pre-mark them
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("getSentFriendRequests", { userId });

    const handleSentRequests = (sentIds: string[]) => {
      setRequestedIds(new Set(sentIds));
    };

    socket.on("sentFriendRequestsList", handleSentRequests);

    return () => {
      socket.off("sentFriendRequestsList", handleSentRequests);
    };
  }, [userId]);

  // Fetch all users on mount & filter when searchQuery changes
  useEffect(() => {
    if (!userId) return;

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const foundUsers = await searchUsers(searchQuery.trim(), userId);
        setUsers(Array.isArray(foundUsers) ? foundUsers : []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, userId]);

  const handleSendRequest = async (receiverId: string) => {
    const socket = getSocket();
    if (!socket || !userId) return;

    socket.emit("sendFriendRequest", {
      senderId: userId,
      receiverId,
    });

    // Immediately mark as requested in UI
    setRequestedIds((prev) => new Set(prev).add(receiverId));
    setMessage("Friend request sent!");
  };

  return (
    <div className="bg-[var(--card)] text-[var(--foreground)] h-full w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col shadow-xs p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--accent)] mb-0.5">
            Find Friends
          </h1>
          <p className="text-xs text-[var(--foreground)]/60">
            All registered users in Chugli Chat
          </p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold border border-[var(--accent)]/20">
          {users.length} {users.length === 1 ? "user" : "users"}
        </span>
      </div>

      <div className="relative w-full mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full bg-[var(--input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none h-10 rounded-full px-4 text-sm text-[var(--foreground)] transition shadow-2xs placeholder:text-[var(--foreground)]/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-xs text-[var(--foreground)] opacity-50 hover:opacity-100 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {message && (
        <p className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg mb-3">
          ✓ {message}
        </p>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {loading ? (
          <div className="text-center py-12 text-[var(--foreground)]/50 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span>Loading registered users...</span>
          </div>
        ) : Array.isArray(users) && users.length > 0 ? (
          users.map((user) => {
            const isRequested = requestedIds.has(user._id);
            return (
              <div
                key={user?._id}
                className="flex items-center justify-between bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-xl p-3 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Image
                    src={user?.profilePic || "/default-profile-pic.jpg"}
                    alt="pic"
                    className="w-10 h-10 rounded-full border border-[var(--border)] object-cover shadow-2xs flex-shrink-0"
                    width={40}
                    height={40}
                  />
                  <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                    {user?.username}
                  </p>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
                    isRequested
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 cursor-not-allowed border border-amber-500/30"
                      : "bg-[var(--accent)] hover:opacity-90 text-white shadow-2xs"
                  }`}
                  onClick={() => !isRequested && handleSendRequest(user._id)}
                  disabled={isRequested}
                >
                  {isRequested ? "Requested ✓" : "Add Contact"}
                </button>
              </div>
            );
          })
        ) : searchQuery.trim() ? (
          <p className="text-xs text-center text-[var(--foreground)]/50 py-8">
            No users found matching &quot;{searchQuery}&quot;
          </p>
        ) : (
          <div className="text-center py-10 text-[var(--foreground)]/50 text-xs">
            No other registered users available to add
          </div>
        )}
      </div>
    </div>
  );
};

export default FindUser;
