"use client";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Pencil, Mail, X, Camera, Lock, AtSign } from "lucide-react";
import { floatingEmojisAtom, userAtom, User } from "../../states/States";
import { showToast } from "../../components/Toast";
import { motion } from "framer-motion";
import Image from "next/image";

import { getApiUrl } from "../../utils/apiUrl";

const ProfilePage: React.FC = () => {
  const [user, setUser] = useAtom(userAtom);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [floatingEmojis] = useAtom(floatingEmojisAtom);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.profilePic]);

  const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isImageNotFound = (pic?: string) => {
    if (!pic) return true;
    return pic.trim() === "";
  };

  const updateUser = async (updatedData: Partial<User>) => {
    try {
      const token = localStorage.getItem("chatAppToken");
      const res = await fetch(`${getApiUrl()}/api/users/updateProfile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("chatAppUser", JSON.stringify(data.user));
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error updating profile";
      showToast(msg, "error");
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
      showToast("File too large! Max 10MB allowed.", "warning");
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

  const handleSaveDisplayName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast("Display name cannot be empty", "warning");
      setIsEditingName(false);
      return;
    }
    setUser((prev) => ({ ...prev, name: trimmed }));
    await updateUser({ name: trimmed });
    setIsEditingName(false);
    showToast("Display name updated successfully", "success");
  };

  const handleSaveAbout = async (newAbout: string) => {
    const trimmed = newAbout.trim();
    setUser((prev) => ({ ...prev, about: trimmed }));
    await updateUser({ about: trimmed });
    setIsEditingAbout(false);
    showToast("About updated successfully", "success");
  };

  return (
    <div className="relative flex flex-col items-center justify-start bg-[var(--background)] text-[var(--foreground)] w-full min-h-screen p-6">
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

      <div className="flex flex-col justify-start items-center w-full max-w-md bg-[var(--card-foreground)] text-[var(--card)] p-6 rounded-2xl shadow-inner overflow-y-auto space-y-4">
        {/* Profile Image */}
        <div className="relative flex flex-col items-center">
          {isImageNotFound(user?.profilePic) || imageError ? (
            <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-white font-bold text-4xl border-4 border-[var(--accent)] select-none shadow-inner">
              {getInitials(user?.name || user?.username)}
            </div>
          ) : (
            <Image
              src={user?.profilePic || "/user.jpg"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-[var(--accent)] cursor-pointer hover:scale-105 transition"
              onClick={() => setPreviewModal(true)}
              onError={() => setImageError(true)}
              width={128}
              height={128}
              unoptimized
            />
          )}
          <label
            htmlFor="changeProfile"
            className="absolute bottom-0 right-0 bg-[var(--accent)] text-[var(--card-foreground)] hover:opacity-90 transition p-2.5 rounded-full cursor-pointer shadow"
          >
            <Camera size={18} />
          </label>
          <input
            id="changeProfile"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileChange}
          />
        </div>

        <div className="mt-1 mb-2">
          <label
            htmlFor="changeProfilePic"
            className="flex items-center justify-center bg-[var(--card)] text-[var(--foreground)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" />
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

        {/* Display Name (Editable) */}
        <div className="flex flex-col items-center justify-center w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={user?.name || user?.username}
                onBlur={(e) => handleSaveDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDisplayName((e.target as HTMLInputElement).value);
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                maxLength={50}
                className="bg-[var(--input)] border border-[var(--border)] px-3 py-1.5 rounded-xl text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] text-2xl font-semibold text-center"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl text-[var(--background)] font-bold tracking-tight">
                {user?.name || user?.username}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                title="Edit display name"
                className="p-1 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/20 transition"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Permanent Username Handle (Read-only with Lock) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--background)]/15 text-[var(--background)] text-xs font-mono">
          <AtSign size={13} className="text-[var(--accent)]" />
          <span className="font-semibold">{user?.username}</span>
          <span
            className="flex items-center gap-0.5 ml-1 text-[10px] text-[var(--accent)] bg-[var(--background)] px-1.5 py-0.5 rounded-full font-sans font-medium"
            title="Permanent unique handle assigned at registration. Cannot be modified."
          >
            <Lock size={10} /> Permanent
          </span>
        </div>

        <div className="text-xs text-center text-[var(--card)]/70 mb-4">
          Personalize your display name to make it feel like home.
        </div>

        {/* About Field (Editable) */}
        <div className="flex flex-col items-center w-full mb-4 text-center">
          <div className="flex items-center gap-2">
            <span className="text-[var(--card)]">
              {isEditingAbout ? (
                <textarea
                  defaultValue={user?.about || ""}
                  onBlur={(e) => handleSaveAbout(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveAbout((e.target as HTMLTextAreaElement).value);
                    }
                  }}
                  className="bg-[var(--input)] border border-[var(--border)] px-3 py-2 rounded-xl text-[var(--foreground)] w-64 h-16 resize-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                  autoFocus
                />
              ) : (
                <span className="text-base text-[var(--background)]">
                  {user?.about || "Hey there! I’m using Chugli."}
                </span>
              )}
            </span>
            {!isEditingAbout && (
              <button
                type="button"
                onClick={() => setIsEditingAbout(true)}
                title="Edit about"
                className="p-1 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/20 transition"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-[var(--muted)] pt-2 border-t border-[var(--card)]/10 w-full justify-center">
          <Mail className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm text-[var(--background)]">{user?.email}</span>
        </div>
      </div>

      {/* Profile Image Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
