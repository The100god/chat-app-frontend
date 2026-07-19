"use client";
import React, { useEffect, useState } from "react";
import GroupFormModal from "./GroupFormModal";
import { useAtom } from "jotai";
import {
  groupAdminsAtom,
  groupMembersAtom,
  groupNameAtom,
  groupProfileAtom,
  isNewGroupWindowAtom,
  responsiveDeviceAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
} from "../states/States";
import { connectSocket } from "../hooks/useSocket";
import Image from "next/image";

export interface GroupMember {
  _id: string;
  username: string;
  profilePic: string;
  about?: string;
  email?: string;
}

export interface Group {
  _id: string;
  groupName: string;
  groupProfilePic: string;
  description?: string;
  groupMember: GroupMember[];
  admins: GroupMember[];
  superAdmin: GroupMember | string | null;
}

const GroupChatPage = () => {
  const [userId] = useAtom(userIdAtom);
  const socket = connectSocket(userId);
  const [isNewGroupWindow, setIsNewGroupWindow] = useAtom(isNewGroupWindowAtom);
  const [groupName, setGroupName] = useAtom(groupNameAtom);
  const [groupAdmins, setGroupAdmins] = useAtom(groupAdminsAtom);
  const [groupMembers, setGroupMembers] = useAtom(groupMembersAtom);
  const [groupProfile, setGroupProfile] = useAtom(groupProfileAtom);

  const [selectedGroup, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [, setSelectedFriend] = useAtom(selectedFriendAtom); // clear friend
  const [groups, setGroups] = useState<Group[]>([]);
  const [, setShowLeft] = useAtom(responsiveDeviceAtom);



  const handleCreateGroupModalSubmit = async () => {
    try {
      const groupDataVariables = {
        groupName: groupName,
        groupProfilePic: groupProfile,
        groupMember: [...groupMembers, userId],
        admins: [...groupAdmins, userId],
        superAdmin: userId,
      };
      const groupData = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/groups/create-group`,
        {
          method: "Post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupDataVariables),
        }
      );
      const groupDataRes = await groupData.json(); // parse it

      if (groupData.ok) {
        // setGroups((prev)=>[...prev, newGroup]);

        socket?.emit("createGroup", {
          groupId: groupDataRes._id,
          adminId: groupAdmins,
          members: groupMembers,
          superAdmin: userId,
          groupName: groupName,
        });

        setGroupProfile("");
        setGroupName("");
        setIsNewGroupWindow(false);
        setGroupMembers([]);
        setGroupAdmins([]);
      } else {
        console.error("Failed to create group:", groupDataRes.message);
      }

      // const groupId = groupDataRes._id; // or whatever your backend returns
      // console.log("groupData", groupData);

      // socket?.emit("createGroup", {
      //   groupId: groupId,
      //   adminId: groupAdmins,
      //   members: groupMembers,
      //   superAdmin: userId,
      //   groupName: groupName,
      // });
    } catch (error) {
      console.error("Error creating Group:", error);
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/groups/${userId}`
        );
        const allGroups = await response.json();
        // console.log("All Groups:", allGroups);
        // You can store this in state if needed
        setGroups(allGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (group: Group) => {
      setGroups((prev) => {
        const exists = prev.some((g) => g._id === group._id);
        if (exists) return prev;
        return [...prev, group];
      });
    };

    const handleGroupUpdated = (updatedGroup: Group) => {
      setGroups((prev) =>
        prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g))
      );
      if (selectedGroup?._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
      }
    };

    const handleGroupDeleted = ({ groupId }: { groupId: string }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }
    };

    const handleRemovedFromGroup = ({ groupId }: { groupId: string }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }
    };

    const handleLeftGroup = ({ groupId }: { groupId: string }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }
    };

    socket.on("newGroupCreated", handleNewGroup);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("groupDeleted", handleGroupDeleted);
    socket.on("removedFromGroup", handleRemovedFromGroup);
    socket.on("leftGroup", handleLeftGroup);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("groupDeleted", handleGroupDeleted);
      socket.off("removedFromGroup", handleRemovedFromGroup);
      socket.off("leftGroup", handleLeftGroup);
    };
  }, [socket, selectedGroup, setSelectedGroup]);
  if (!userId && !socket) return null;

  // console.log("groups", groups);
  return (
    <div className="flex p-2 flex-col space-y-5 bg-[var(--background)] text-[var(--foreground)] h-full w-full rounded-md overflow-y-auto">
      <div
        className="flex justify-center items-center text-center h-fit w-fit px-2 py-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/15 border-amber-50 cursor-pointer"
        onClick={() => setIsNewGroupWindow(true)}
      >
        {" "}
        + create new group
      </div>
      {isNewGroupWindow && (
        <GroupFormModal
          handleCreateGroupModalSubmit={handleCreateGroupModalSubmit}
        />
      )}

      <div className="flex flex-col h-[70vh] w-full overflow-auto space-y-4">
        {groups &&
          groups?.map((g, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-3 bg-[var(--card)] text-[var(--foreground)] rounded-md shadow-sm hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] transition cursor-pointer"
              onClick={() => {
                setSelectedFriend(null);
                setSelectedGroup(g);
                setShowLeft(false);
              }}
            >
              <Image
                src={g?.groupProfilePic || "/user.jpg"}
                alt="Group"
                className="w-12 h-12 rounded-full border-2 border-[var(--accent)] object-cover"
                width={48}
                height={48}
              />
              <span className="text-lg text-[var(--foreground)] font-medium">{g?.groupName}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default GroupChatPage;
