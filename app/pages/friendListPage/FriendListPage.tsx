"use client";
import FriendsList from "../../components/FriendsList";

interface AllFriendsListProps {
  loading: boolean;
}

export default function FriendListPage({loading}: AllFriendsListProps) {
  return <FriendsList loading={loading}/>;
}
