"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAtom } from "jotai";
import {
  allFriendsAtom,
  findFriendAtom,
  findFriendWithChatAtom,
  Friend,
  friendsAtom,
  friendsCountsAtom,
  friendsRequestsAtom,
  groupChatOpenAtom,
  // userAtom,
  userIdAtom,
} from "../../states/States";
// import FriendsList from "../../components/FriendsList";
// import FindUser from "../../components/FindUser";
// import AllFriends from "../../components/AllFriends";
// import FriendRequests from "../../components/FriendRequests";
// import GroupChatPage from "../../components/GroupChatPage";
import { useSocket } from "../../hooks/useSocket";
import FindFriend from "../findFriends/page";
// import FindAllFriend from "../findAllFriend/page";
import FriendRequestPage from "../friendRequestPage/page";
// import FriendListPage from "../friendListPage/page";
import GroupChat from "../groupChatPage/page";
import AllFriends from "../../components/AllFriends";
import FriendsList from "../../components/FriendsList";


const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export default function LeftSection() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useAtom<Friend[]>(friendsAtom);
  const [loading, setLoading] = useState<boolean>(true);
  const [findFriend] = useAtom(findFriendAtom);
  const [friendsRequests] = useAtom(friendsRequestsAtom);
  const [allFriends] = useAtom(allFriendsAtom);
  const [groupChatOpen] = useAtom(groupChatOpenAtom);
  const [, setFriendsCounts] = useAtom(friendsCountsAtom);
  const [findFriendWithChat] = useAtom(findFriendWithChatAtom);
  // const [user, setUser] = useAtom(userAtom);
  const [userId, setUserId] = useAtom(userIdAtom);
  // const [userId, setUserId] = useAtom(() => localStorage.getItem("userId"));
  const socket = useSocket(userId);
  // Fetch friends data from backend
  const fetchFriends = useCallback(async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/friends/get-friends/${userId}`
      );
      const data = await response.json();
      setFriends(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setLoading(true);
    }
  }, [userId, setFriends]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
    }
  }, [setUserId]);

  // Run fetchFriends when the component mounts
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFriends();
    }
  }, [isAuthenticated, userId, fetchFriends]);

  // Listen to real-time updates from socket
  useEffect(() => {
    if (!socket || !userId) return;

    const handleFriendsUpdate = (updatedFriends: Friend[]) => {
      setFriends(updatedFriends);
    };

    const handleUnseenCountUpdate = ({
      friendId,
      count,
    }: {
      friendId: string;
      count: number;
    }) => {
      // console.log("count", count);
      setFriends((prevFriends) =>
        prevFriends.map((friend) =>
          friend.friendId === friendId
            ? { ...friend, unreadMessagesCount: count }
            : friend
        )
      );
      setLoading(false);
    };

    socket.on("friendsUpdated", handleFriendsUpdate);
    // socket.on("update_unseen_count", handleUnseenCountUpdate);
    socket.on("unreadMessageCountUpdated", handleUnseenCountUpdate);
    // 🔌 Ask for unseen count on reconnect/mount
    socket.emit("getFriendListWithUnseen", { userId });
    return () => {
      socket.off("friendsUpdated", handleFriendsUpdate);
      socket.off("unreadMessageCountUpdated", handleUnseenCountUpdate);
      // socket.off("update_unseen_count", handleUnseenCountUpdate);
    };
  }, [socket, userId, setFriends]);

  useEffect(() => {
    setFriendsCounts((prev) => {
      if (prev !== friends.length) {
        return friends.length;
      }
      return prev;
    });
  }, [friends, setFriendsCounts]);

  // useEffect(() => {

  //   if (!isAuthenticated) return;

  //   const fetchUserProfile = async () => {
  //     const token = localStorage.getItem("chatAppToken");
  //     console.log("token", token);
  //     if (!token) return;

  //     fetch(`http://localhost:5000/api/users/me`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     })
  //       .then(async (res) => {
  //         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  //         const data = await res.json();
  //         console.log("Fetched user:", data);
  //         setUser({
  //           username: data.username,
  //           email: data.email,
  //           profilePic: data.profilePic,
  //           about: data.about || "Hey there! I’m using ChatApp 💬",
  //         });
  //       })
  //       .catch((err) => console.error("Error fetching user:", err));
  //   };

  //   fetchUserProfile();

  // }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Don't show anything if not authenticated
  }

  // console.log("friends", friends);
  return (
    <div className="flex p-4 bg-[var(--background)] text-[var(--foreground)] h-full w-full rounded-md overflow-y-auto">
      {findFriend && <FindFriend />}
      {/* {findFriend && <FindUser />} */}
      {/* {allFriends && <AllFriends friends={friends} loading={loading} />} */}
      {friendsRequests && <FriendRequestPage />}
      {allFriends && <AllFriends friends={friends} loading={loading} />}
      {groupChatOpen && <GroupChat />}
      {findFriendWithChat && <FriendsList loading={loading} />}
      {/* {findFriend ? (
        <FindUser />
      ) : friendsRequests ? (
        <FriendRequests />
      ) : allFriends ? (
        <AllFriends friends={friends} loading={loading} />
      ) : groupChatOpen ? (
        <GroupChatPage/>
      ): (
        <FriendsList friends={friends} loading={loading} />
      )} */}
    </div>
  );
}
