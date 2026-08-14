"use client";
import React from "react";
import ScaleTN from "./ScaleTN";
import Image from "next/image";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
}

interface AllFriendsListProps {
  friends: Friend[];
  loading: boolean;
}

const AllFriends: React.FC<AllFriendsListProps> = ({ friends, loading }) => {
  return (
    <div className="bg-[var(--card)] text-[var(--foreground)] h-full w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col shadow-xs p-4">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-3">
        <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">All Contacts</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
          {Array.isArray(friends) ? friends.length : 0} friends
        </span>
      </div>

      {loading ? (
        <ScaleTN rows={5} />
      ) : !Array.isArray(friends) || friends.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground)]/50 text-xs">
          No friends found in your contact book
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {friends.map((friend) => (
            <div
              key={friend?.friendId}
              className="flex items-center space-x-3 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-xl p-3 transition"
            >
              <Image
                src={friend?.profilePic || "/default-profile-pic.jpg"}
                alt={friend?.username}
                className="w-11 h-11 rounded-full border border-[var(--border)] object-cover shadow-2xs flex-shrink-0"
                width={44}
                height={44}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {friend?.username}
                </p>
                <p className="text-xs text-[var(--foreground)]/50">Available</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllFriends;
