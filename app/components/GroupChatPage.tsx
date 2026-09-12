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
  groupsAtom,
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
  unreadCount?: number;
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
  const [groups, setGroups] = useAtom(groupsAtom);
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

    const handleGroupUnreadCountUpdated = ({
      groupId,
      count,
    }: {
      groupId: string;
      count: number;
    }) => {
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, unreadCount: count } : g))
      );
    };

    const handleNewGroupMessage = (newMsg: any) => {
      const msgGroupId =
        typeof newMsg.groupId === "object"
          ? newMsg.groupId?._id?.toString() || newMsg.groupId?.toString()
          : newMsg.groupId?.toString();
      if (!msgGroupId) return;

      // If user is currently looking at this group, unread count stays 0
      if (selectedGroup?._id === msgGroupId) return;

      setGroups((prev) =>
        prev.map((g) =>
          g._id === msgGroupId
            ? { ...g, unreadCount: (g.unreadCount || 0) + 1 }
            : g
        )
      );
    };

    socket.on("newGroupCreated", handleNewGroup);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("groupDeleted", handleGroupDeleted);
    socket.on("removedFromGroup", handleRemovedFromGroup);
    socket.on("leftGroup", handleLeftGroup);
    socket.on("groupUnreadCountUpdated", handleGroupUnreadCountUpdated);
    socket.on("newGroupMessage", handleNewGroupMessage);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("groupDeleted", handleGroupDeleted);
      socket.off("removedFromGroup", handleRemovedFromGroup);
      socket.off("leftGroup", handleLeftGroup);
      socket.off("groupUnreadCountUpdated", handleGroupUnreadCountUpdated);
      socket.off("newGroupMessage", handleNewGroupMessage);
    };
  }, [socket, selectedGroup, setSelectedGroup]);
  if (!userId && !socket) return null;

  // console.log("groups", groups);
  return (
    <div className="bg-[var(--card)] text-[var(--foreground)] h-full w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col shadow-xs">
      {/* WhatsApp Groups List Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
        <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Groups</h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          onClick={() => setIsNewGroupWindow(true)}
        >
          <span>+ New Group</span>
        </button>
      </div>

      {isNewGroupWindow && (
        <GroupFormModal
          handleCreateGroupModalSubmit={handleCreateGroupModalSubmit}
        />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {!groups || groups.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--foreground)]/70">
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold text-sm">No groups yet</p>
            <p className="text-xs opacity-60 mt-1">Create a group to start chatting together</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]/40">
            {groups.map((g, i) => {
              const isSelected = selectedGroup?._id === g?._id;
              const memberCount = g?.groupMember?.length || 0;
              const unread = g?.unreadCount || 0;

              return (
                <div
                  key={g?._id || i}
                  className={`flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? "bg-[var(--accent)]/15 border-l-4 border-l-[var(--accent)] text-[var(--foreground)]"
                      : "hover:bg-[var(--muted)]"
                  }`}
                  onClick={() => {
                    setSelectedFriend(null);
                    setSelectedGroup(g);
                    setGroups((prev) =>
                      prev.map((item) =>
                        item._id === g._id ? { ...item, unreadCount: 0 } : item
                      )
                    );
                    if (socket && userId) {
                      socket.emit("groupMessagesRead", {
                        groupId: g._id,
                        readerId: userId,
                      });
                    }
                    setShowLeft(false);
                  }}
                >
                  <div className="relative mr-3.5 flex-shrink-0">
                    <Image
                      src={g?.groupProfilePic || "/user.jpg"}
                      alt="Group"
                      className="w-12 h-12 rounded-full border border-[var(--border)] object-cover shadow-2xs"
                      width={48}
                      height={48}
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--accent)] border-2 border-[var(--card)] rounded-full flex items-center justify-center text-[8px] text-white">
                      👥
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${isSelected ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--foreground)]"}`}>
                        {g?.groupName}
                      </span>
                      {unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-[11px] font-bold bg-[var(--accent)] text-white rounded-full flex-shrink-0 shadow-xs">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground)]/60 truncate">
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatPage;
