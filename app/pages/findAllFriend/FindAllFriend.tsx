"use client";

import AllFriends from "../../components/AllFriends";
interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
}

interface AllFriendsListProps {
  friends: Friend[];
  loading: boolean;
}

export default function FindAllFriend({friends, loading}: AllFriendsListProps) {
  return <AllFriends friends={friends} loading={loading} />;
}
