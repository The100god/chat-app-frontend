"use client";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Pencil, Mail, X, Camera } from "lucide-react";
import { floatingEmojisAtom, userAtom } from "../../states/States";
import { motion } from "framer-motion";

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

const API_BASE = `${backendUrl}/api/users`;

const ProfilePage: React.FC = () => {
  const [user, setUser] = useAtom(userAtom);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [floatingEmojis] = useAtom(floatingEmojisAtom);

  const updateUser = async (updatedData: any) => {
    try {
      const token = localStorage.getItem("chatAppToken");
      const res = await fetch(`${API_BASE}/updateProfile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleProfileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert("File too large! Max 10MB allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUser((prev) => ({ ...prev, profilePic: base64 }));
      await updateUser({ profilePic: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async (newName: string) => {
    setUser((prev) => ({ ...prev, username: newName }));
    await updateUser({ username: newName });
    setIsEditingName(false);
  };

  const handleSaveAbout = async (newAbout: string) => {
    setUser((prev) => ({ ...prev, about: newAbout }));
    await updateUser({ about: newAbout });
    setIsEditingAbout(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-start bg-[var(--background)] text-[var(--foreground)] w-full min-h-screen p-6">
      {/* Profile Image */}
      {/* 🌸 Floating faint emojis */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {floatingEmojis.map((e) => (
          <motion.span
            key={e.id}
            initial={{ opacity: 0.05, y: 0 }}
            animate={{
              opacity: [0.08, 0.35, 0.06],
              y: [10, -25, 10],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute select-none pointer-events-none"
            style={{
              top: `${e.y}%`,
              left: `${e.x}%`,
              fontSize: `${e.size}rem`,
              opacity: 0.9,
              filter: "blur(0.5px)",
            }}
          >
            {e.emoji}
          </motion.span>
        ))}
      </div>
      <div className="flex flex-col justify-start items-center w-full max-w-md bg-[var(--card-foreground)] text-[var(--card)] p-4 rounded-2xl shadow-inner overflow-y-auto space-y-4">
        <div className="relative flex flex-col items-center">
          <img
            src={user?.profilePic}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-[var(--accent)] cursor-pointer hover:scale-105 transition"
            onClick={() => setPreviewModal(true)}
          />
          <label
            htmlFor="changeProfile"
            className="absolute bottom-0 right-0 bg-[var(--accent)] hover:opacity-90 transition text-sm px-3 py-3 rounded-full cursor-pointer"
          >
            <Camera size={20} radius={100} />
          </label>
          <input
            id="changeProfile"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileChange}
          />
        </div>

        <div className="mt-1 mb-12">
          <label
            htmlFor="changeProfilePic"
            className="flex items-center justify-center bg-[var(--card)] text-[var(--foreground)] border border-[var(--accent)] hover:bg-[var(--accent)] transition text-sm px-3 py-2 rounded-md cursor-pointer "
          >
            <Camera className="mr-2 h-4 w-4" />
            Change photo
          </label>
          <input
            id="changeProfilePic"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileChange}
          />
        </div>

        {/* Username */}
        <div className="flex items-center justify-center gap-3 w-full mb-1 ">
          {isEditingName ? (
            <input
              type="text"
              defaultValue={user?.username}
              onBlur={(e) => handleSaveName(e.target.value)}
              className="bg-[var(--input)] border border-[var(--border)] px-3 py-1 rounded-md text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)]"
              autoFocus
            />
          ) : (
            <>
              <h2 className="text-3xl text-[var(--background)] font-semibold">
                {user?.username}
              </h2>
              <Pencil
                className="h-10 w-10 text-[var(--accent)] hover:text-[var(--primary)] hover:bg-red-500/40 px-2 py-1 rounded-md cursor-pointer"
                onClick={() => setIsEditingName(true)}
              />
            </>
          )}
        </div>
         <div className="text-pretty text-[var(--card)] mb-6">
                Personalize your profile to make it feel like home.
              </div>

        {/* About Field */}
        <div className="flex flex-col items-center w-full mb-4 text-center">
          <div className="flex items-center gap-2">
            <span className="text-[var(--card)]">
              {isEditingAbout ? (
                <textarea
                  defaultValue={user?.about || ""}
                  onBlur={(e) => handleSaveAbout(e.target.value)}
                  className="bg-[var(--input)] border border-[var(--border)] px-3 py-2 rounded-md text-[var(--foreground)] w-64 h-16 resize-none focus:ring-2 focus:ring-[var(--ring)]"
                  autoFocus
                />
              ) : (
                <span className="text-lg text-[var(--background)]">
                  {user?.about || "Hey there! I’m using ChatApp 💬 "}
                </span>
              )}
            </span>
            {!isEditingAbout && (
              <Pencil
                className="h-8 w-8 text-[var(--accent)] hover:text-[var(--primary)] hover:bg-red-500/40 px-2 py-1 rounded-md cursor-pointer"
                onClick={() => setIsEditingAbout(true)}
              />
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <Mail className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-lg text-[var(--background)] ">{user?.email}</span>
        </div>
      </div>

      {/* Profile Image Modal */}
      {previewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div className="relative">
            <img
              src={user?.profilePic}
              alt="Full Profile"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg object-contain"
            />
            <button
              onClick={() => setPreviewModal(false)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
