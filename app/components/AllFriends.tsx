"use client";
import React from "react";

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
    <div className="p-4 w-full bg-transparent">
      <h2 className="text-lg text-[var(--foreground)] font-semibold mb-4">Friends</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3 w-full">
          {friends?.map((friend) => (
            <li
              key={friend?.friendId}
              className="flex flex-row justify-between items-center bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]/15 rounded-xl cursor-pointer transition duration-200 border border-[var(--foreground)] hover:border-[var(--accent)] w-[90%] p-2"
            >
              <img
                src={friend?.profilePic || "/default-profile-pic.jpg"}
                alt={friend?.username}
                className="w-12 h-12 rounded-full mr-3 border-2 border-[var(--accent)]"
              />
              <div className="flex-1">
                <p className="text-lg font-medium">{friend?.username}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllFriends;
