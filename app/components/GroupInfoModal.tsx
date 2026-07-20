"use client";
import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedGroupAtom, userIdAtom, friendsAtom } from "../states/States";
import { showToast } from "./Toast";
import { 
  X, Edit2, UserPlus, UserMinus, ShieldAlert, ShieldCheck, 
  LogOut, Trash2, Camera, Save, Info, Users, Shield
} from "lucide-react";
import Image from "next/image";

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ isOpen, onClose }) => {
  const [userId] = useAtom(userIdAtom);
  const [selectedGroup, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [friends] = useAtom(friendsAtom);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [groupProfilePic, setGroupProfilePic] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Sub-views
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "members">("details");

  useEffect(() => {
    if (selectedGroup) {
      setGroupName(selectedGroup.groupName);
      setDescription(selectedGroup.description || "Hey there! We are using Chugli 💬");
      setGroupProfilePic(selectedGroup.groupProfilePic);
    }
  }, [selectedGroup]);

  if (!isOpen || !selectedGroup) return null;

  const superAdminId = typeof selectedGroup.superAdmin === "object" && selectedGroup.superAdmin
    ? selectedGroup.superAdmin._id
    : selectedGroup.superAdmin;

  const isAdmin = selectedGroup.admins.some((admin) => admin._id === userId) || superAdminId === userId;
  const isSuperAdmin = superAdminId === userId;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Handle image upload and base64 conversion
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = 10;
    if (file.size / (1024 * 1024) > maxSizeMB) {
      showToast(`${file.name} is too large. Max size is ${maxSizeMB}MB.`, "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupProfilePic(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Name, Description, Profile Pic
  const handleSaveChanges = async () => {
    setSavingInfo(true);
    try {
      const res = await fetch(`${API_URL}/api/groups/update-info/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          description,
          groupProfilePic: groupProfilePic !== selectedGroup.groupProfilePic ? groupProfilePic : undefined,
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(data.group);
        setIsEditing(false);
        showToast("Group details updated successfully!", "success");
      } else {
        showToast(data.message || "Failed to update group details.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving changes.", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  // Add Member
  const handleAddMember = async (friendId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/groups/add-members/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [friendId],
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(data.group);
        showToast("Member added to group!", "success");
      } else {
        showToast(data.message || "Failed to add member.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/remove-member/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(data.group);
        showToast("Member removed from group.", "info");
      } else {
        showToast(data.message || "Failed to remove member.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Promote Member to Admin
  const handlePromoteAdmin = async (memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/groups/promote/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(data.group);
        showToast("Member promoted to Admin!", "success");
      } else {
        showToast(data.message || "Failed to promote member.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Demote Admin to Member
  const handleDemoteAdmin = async (memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/groups/demote/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(data.group);
        showToast("Admin demoted to Member.", "info");
      } else {
        showToast(data.message || "Failed to demote admin.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/leave/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(null);
        onClose();
        showToast("You left the group.", "info");
      } else {
        showToast(data.message || "Failed to leave group.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!confirm("🚨 WARNING: This will permanently delete the group and all its messages. This action cannot be undone. Are you absolutely sure?")) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/delete-group/${selectedGroup._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedGroup(null);
        onClose();
        showToast("Group deleted permanently.", "info");
      } else {
        showToast(data.message || "Failed to delete group.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter friends who are NOT already in the group
  const nonGroupFriends = friends.filter(
    (friend) => !selectedGroup.groupMember.some((member) => member._id === friend.friendId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="relative bg-[var(--card)] text-[var(--foreground)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[var(--accent)]/20">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--accent)]/15 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Tabs */}
        <div className="flex border-b border-[var(--accent)]/15 bg-[var(--accent)]/5">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-all border-b-2 ${
              activeTab === "details"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            <Info className="w-4 h-4" />
            Group Info
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-all border-b-2 ${
              activeTab === "members"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            <Users className="w-4 h-4" />
            Members ({selectedGroup.groupMember.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "details" && (
            <div className="space-y-6 flex flex-col items-center">
              
              {/* Profile Photo Display */}
              <div className="relative group w-28 h-28">
                <Image
                  src={groupProfilePic || "/user.jpg"}
                  alt="Group Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[var(--accent)]/30 shadow-lg"
                  width={112}
                  height={112}
                />
                {isAdmin && isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      id="update-group-photo"
                      className="hidden"
                      onChange={handleProfilePicChange}
                    />
                    <label
                      htmlFor="update-group-photo"
                      className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition duration-300"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      Change Photo
                    </label>
                  </>
                )}
              </div>

              {/* Group Name & Description Edit/View */}
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wider mb-1">
                    Group Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--accent)]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] font-semibold"
                    />
                  ) : (
                    <div className="text-xl font-bold text-[var(--foreground)]">
                      {selectedGroup.groupName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--accent)]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)] resize-none"
                    />
                  ) : (
                    <p className="text-sm text-[var(--foreground)]/80 bg-[var(--accent)]/5 p-4 rounded-xl border border-[var(--accent)]/10 italic">
                      {selectedGroup.description || "Hey there! We are using Chugli 💬"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Details Tab */}
              <div className="w-full pt-4 flex flex-col gap-3">
                {isAdmin && (
                  isEditing ? (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={handleSaveChanges}
                        disabled={savingInfo}
                        className="flex-1 cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <Save className="w-4 h-4" />
                        {savingInfo ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setGroupName(selectedGroup.groupName);
                          setGroupProfilePic(selectedGroup.groupProfilePic);
                          setDescription(selectedGroup.description || "");
                        }}
                        className="flex-1 cursor-pointer bg-[var(--card)] hover:bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--foreground)] font-semibold py-2.5 px-4 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full cursor-pointer bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[var(--accent)] font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-[var(--accent)]/30 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Group Info
                    </button>
                  )
                )}

                {/* Leave Group Button */}
                <button
                  onClick={handleLeaveGroup}
                  className="w-full cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Group
                </button>

                {/* Delete Group Button (Admin only) */}
                {isAdmin && (
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Group
                  </button>
                )}
              </div>

            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-6">
              
              {/* Add Members Trigger Button */}
              {isAdmin && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddMembers(!showAddMembers)}
                    className="w-full cursor-pointer bg-[var(--accent)] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    {showAddMembers ? "Done Adding" : "Add Group Members"}
                  </button>

                  {/* Add Members Section */}
                  {showAddMembers && (
                    <div className="border border-[var(--accent)]/10 rounded-xl p-3 bg-[var(--accent)]/5 max-h-48 overflow-y-auto space-y-2">
                      <div className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">
                        Add Friends
                      </div>
                      {nonGroupFriends.length === 0 ? (
                        <div className="text-sm text-[var(--foreground)]/40 text-center py-4">
                          All friends are already members.
                        </div>
                      ) : (
                        nonGroupFriends.map((fnd) => (
                          <div
                            key={fnd.friendId}
                            className="flex justify-between items-center bg-[var(--card)] p-2 rounded-lg border border-[var(--accent)]/10"
                          >
                            <div className="flex items-center gap-3">
                              <Image
                                src={fnd.profilePic || "/user.jpg"}
                                alt={fnd.username}
                                className="w-8 h-8 rounded-full object-cover border border-[var(--accent)]/20"
                                width={32}
                                height={32}
                              />
                              <span className="text-sm font-semibold">{fnd.username}</span>
                            </div>
                            <button
                              onClick={() => handleAddMember(fnd.friendId)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg transition"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">
                  Group Members
                </div>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {selectedGroup.groupMember.map((member) => {
                    const isMemberSuperAdmin = member._id === superAdminId;
                    const isMemberAdmin = selectedGroup.admins.some((adm) => adm._id === member._id);
                    const isCurrentUser = member._id === userId;

                    return (
                      <div
                        key={member._id}
                        className="flex justify-between items-center bg-[var(--card)] p-3 rounded-xl border border-[var(--accent)]/10 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={member.profilePic || "/user.jpg"}
                            alt={member.username}
                            className="w-9 h-9 rounded-full object-cover border-2 border-[var(--accent)]/30"
                            width={36}
                            height={36}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold flex items-center gap-1.5">
                              {member.username}
                              {isCurrentUser && (
                                <span className="text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] py-0.5 px-1.5 rounded-md">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-[var(--foreground)]/60 line-clamp-1">
                              {member.about || "No status details."}
                            </span>
                          </div>
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex items-center gap-2">
                          {/* Role Badges */}
                          {isMemberSuperAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 py-1 px-2 rounded-full shadow-inner">
                              <ShieldAlert className="w-3 h-3" />
                              Creator
                            </span>
                          ) : isMemberAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 py-1 px-2 rounded-full shadow-inner">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : null}

                          {/* Action Options (only visible to admins, for other members who are not the creator) */}
                          {isAdmin && !isCurrentUser && !isMemberSuperAdmin && (
                            <div className="flex items-center gap-1.5">
                              {/* Promote/Demote buttons */}
                              {isMemberAdmin ? (
                                // SuperAdmin/creator can demote admins, or all admins can demote each other. Let's let admins demote other admins.
                                <button
                                  onClick={() => handleDemoteAdmin(member._id)}
                                  title="Demote to Member"
                                  className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePromoteAdmin(member._id)}
                                  title="Promote to Admin"
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}

                              {/* Remove from Group */}
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                title="Remove from Group"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GroupInfoModal;
