"use Client";
import React, { useEffect, useState } from "react";
import GroupFormModal from "./GroupFormModal";
import { useAtom } from "jotai";
import {
  groupAdminsAtom,
  groupMembersAtom,
  groupNameAtom,
  groupProfileAtom,
  isNewGroupWindowAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
} from "../states/States";
import { useSocket } from "../hooks/useSocket";

export interface Group {
  _id: string;
  groupName: String;
  groupProfilePic: string;
  groupMember: String[]; // or User[] if you're populating
  admins: String[];
  superAdmin: String | null;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

const GroupChatPage = () => {
  const [userId] = useAtom(userIdAtom);
  const socket = useSocket(userId);
  const [isNewGroupWindow, setIsNewGroupWindow] = useAtom(isNewGroupWindowAtom);
  const [groupName, setGroupName] = useAtom(groupNameAtom);
  const [groupAdmins, setGroupAdmins] = useAtom(groupAdminsAtom);
  const [groupMembers, setGroupMembers] = useAtom(groupMembersAtom);
  const [groupProfile, setGroupProfile] = useAtom(groupProfileAtom);

  const [, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [, setSelectedFriend] = useAtom(selectedFriendAtom); // clear friend
  const [groups, setGroups] = useState<Group[]>([]);

  if (!userId && !socket) return null;

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
        `${backendUrl}/api/groups/create-group`,
        {
          method: "Post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupDataVariables),
        }
      );
      const groupDataRes = await groupData.json(); // parse it

      if (groupData.ok) {
        const newGroup = {
          _id: groupDataRes._id,
          groupName,
          groupProfilePic: groupProfile,
          groupMember: groupMembers,
          admins: groupAdmins,
          superAdmin: userId,
        };

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
          `${backendUrl}/api/groups/${userId}`
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
      setGroups((prev) => [...prev, group]);
    };

    socket.on("newGroupCreated", handleNewGroup);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
    };
  }, [socket]);
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
              className="flex items-center space-x-4 p-3 bg-[var(--card)] text-[var(--foreground) rounded-md shadow-sm hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent) transition cursor-pointer"
              onClick={() => {
                setSelectedFriend(null);
                setSelectedGroup(g);
              }}
            >
              <img
                src={g?.groupProfilePic}
                alt="Group"
                className="w-12 h-12 rounded-full border-2 border-[var(--accent)] object-cover"
              />
              <span className="text-lg text-[var(--foreground)]] font-medium">{g?.groupName}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default GroupChatPage;
