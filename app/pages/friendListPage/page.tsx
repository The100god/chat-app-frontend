"use client";
import FriendRequests from "../../components/FriendRequests";
import FriendsList from "../../components/FriendsList";

interface AllFriendsListProps {
  loading: boolean;
}

const FriendListPage: React.FC<AllFriendsListProps> = ({loading}) => {
  return <FriendsList loading={loading}/>;
};

export default FriendListPage;
