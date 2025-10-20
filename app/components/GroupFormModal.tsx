import { useAtom } from "jotai";
import {
  friendsAtom,
  groupMembersAtom,
  groupNameAtom,
  groupProfileAtom,
  isNewGroupWindowAtom,
} from "../states/States";
import React from "react";
import { X } from "lucide-react";
import Image from "next/image";

interface GroupFormModalProps {
  handleCreateGroupModalSubmit: () => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  handleCreateGroupModalSubmit,
}) => {
  const [, setGroupName] = useAtom(groupNameAtom);
  const [groupProfile, setGroupProfile] = useAtom(groupProfileAtom); // now base64 string
  const [groupMembers, setGroupMembers] = useAtom(groupMembersAtom);
  const [friends] = useAtom(friendsAtom);
  const [, setIsNewGroupWindow] = useAtom(isNewGroupWindowAtom);

  const handleGroupProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = 50;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      alert(`${file.name} is too large. Max allowed size is ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setGroupProfile(base64String);
    };
    reader.readAsDataURL(file);
  };
  console.log("groupMembers", groupMembers)
  const handleToggleMember = (friendId: string) => {
    setGroupMembers((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-lg">
      <div className="relative bg-[var(--card)] rounded-lg w-full max-w-lg p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <div
          className=" absolute top-3 right-3 h-5 w-5 cursor-pointer hover:bg-red-500 text-red-600 hover:text-white"
          onClick={() => {
            setIsNewGroupWindow(false)
            setGroupMembers([])
            setGroupName("")
            setGroupProfile("")
          }}
        >
          <X className="h-full w-full  " />
        </div>
        <h2 className="text-2xl text-[var(--foreground)]] font-bold mb-4 text-center">
          Create New Group
        </h2>

        <div className="flex flex-col items-center mb-4">
          {groupProfile && (
            <Image
              src={groupProfile}
              alt="Group Profile"
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="groupProfilePic"
            onChange={handleGroupProfile}
          />
          <label
            htmlFor="groupProfilePic"
            className="cursor-pointer px-4 py-2 bg-[var(--accent)] text-white rounded-md"
          >
            Upload Group Photo
          </label>
        </div>

        <div className="mb-4">
          <label htmlFor="groupName" className="block font-medium mb-1">
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full px-3 py-2 border border-[var(--foreground)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ring)] bg-[var(--input)] text-[var(--foreground)]"
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Add Members</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {friends?.map((fnd, index) => {
              const isAdded = groupMembers.includes(fnd.friendId);
              return (
                <div
                  key={index}
                  className="flex justify-between items-center bg-[var(--card)] text-[var(--foreground) hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent) transition cursor-pointer p-2 rounded-md"
                >
                  <div className="flex flex-row gap-4 items-center">
                    <Image
                      src={fnd?.profilePic}
                      alt="frend Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-[var(--accent)]"
                    />
                    <span>{fnd?.username}</span>
                  </div>
                  <button
                    className={`text-sm cursor-pointer px-3 py-1 rounded-md transition ${
                      isAdded
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                    onClick={() => handleToggleMember(fnd.friendId)}
                    //   onClick={() => {
                    //   setGroupMembers((prev) =>
                    //     prev.includes(fnd?.friendId) ? prev : [...prev, fnd?.friendId]
                    //   );
                    // }}
                  >
                    {isAdded ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleCreateGroupModalSubmit}
          className="w-full cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent)]/15 border border-[var(--accent) text-[var(--foreground)] font-semibold py-2 px-4 rounded-md transition"
        >
          Create Group
        </button>
      </div>
    </div>
  );
};

export default GroupFormModal;
