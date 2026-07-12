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

const FindAllFriend: React.FC<AllFriendsListProps> = ({friends, loading}) => {
  return <AllFriends friends={friends} loading={loading} />;
};

export default FindAllFriend;
