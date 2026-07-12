"use client";
import React, { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  Lock,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "../../components/ChangePasswordForm";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<string | null>();
  const [notifications, setNotifications] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
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
    return (
      pic === "/user.jpg" ||
      pic.includes("default-profile-pic") ||
      pic.includes("encrypted-tbn0.gstatic.com") ||
      pic.trim() === ""
    );
  };

  const handleThemeToggle = (theme: "light" | "dark" | "aurora") => {
    document.documentElement.setAttribute("data-theme", theme);
    setMode(theme);
    localStorage.setItem("chatTheme", theme);
  };
  const handleNotificationToggle = () => setNotifications(!notifications);
  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setMode(savedTheme);
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("chatAppToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/deleteAccount`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        localStorage.removeItem("chatAppToken");
        localStorage.removeItem("chatAppUserId");
        window.location.href = "/pages/login";
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete account");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full h-full bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <div className="p-4 border-b border-[var(--accent)] flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Settings ⚙️
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <section>
          <h3 className="text-lg font-bold mb-3">Profile</h3>
          <div className="flex items-center gap-4 bg-[var(--card)] rounded-xl p-4">
            {isImageNotFound(user?.profilePic) || imageError ? (
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-white font-bold text-xl border-2 border-[var(--accent)] shadow-inner">
                {getInitials(user?.username)}
              </div>
            ) : (
              <img
                src={user?.profilePic}
                alt="profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--accent)]"
                onError={() => setImageError(true)}
              />
            )}
            <div className="flex flex-col">
              <span className="text-xl font-semibold">{user?.username}</span>
              <span className="text-[var(--foreground)]/35 text-sm">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            className="mt-3 px-4 py-2 cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent)]/35 text-[var(--background)] hover:text-[var(--foreground)] border border-[var(--foreground)] hover:border-[var(--accent)] rounded-md text-sm font-medium transition"
            onClick={() => (window.location.href = "/pages/profilePage")}
          >
            Edit Profile
          </button>
        </section>

        {/* Account & Privacy */}
        <section>
          <h3 className="text-lg font-bold mb-3">Account & Privacy</h3>
          <div className="space-y-3">
            <SettingItem
              icon={<Lock />}
              label="Change Password"
              action="Edit"
              className="bg-[var(--card)] hover:bg-[var(--accent)]/15"
              onClick={() => setChangePasswordOpen(true)}
            />
            <SettingItem
              icon={<User />}
              label="Online Status"
              action="Visible"
              onClick={() => alert("Coming soon!")}
            />
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-lg font-bold mb-3">Notifications</h3>
          <div className="space-y-3">
            <ToggleItem
              icon={<Bell />}
              label="Message Notifications"
              enabled={notifications}
              onToggle={handleNotificationToggle}
            />
          </div>
        </section>

        {/* Chat Preferences */}
        <section>
          <h3 className="text-lg font-bold mb-3">Chat Preferences</h3>
          <div className="flex flex-row justify-between items-center space-x-3">
            <button
              className={`flex w-full justify-center items-center cursor-pointer ${mode === "light" ? "bg-[var(--accent)]/15" : "bg-[var(--card)]"
                } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--foreground)] hover:border-[var(--accent)]`}
              onClick={() => handleThemeToggle("light")}
            >
              🌞 Light
            </button>
            <button
              className={`flex w-full justify-center items-center cursor-pointer ${mode === "dark" ? "bg-[var(--accent)]/15" : "bg-[var(--card)]"
                } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--foreground)] hover:border-[var(--accent)]`}
              onClick={() => handleThemeToggle("dark")}
            >
              🌙 Dark
            </button>
            <button
              className={`flex w-full justify-center items-center cursor-pointer ${mode === "aurora" ? "bg-[var(--accent)]/15" : "bg-[var(--card)]"
                } hover:bg-[var(--accent)]/15 px-2 py-3 rounded-md border border-[var(--foreground)] hover:border-[var(--accent)]`}
              onClick={() => handleThemeToggle("aurora")}
            >
              🌌 Aurora
            </button>
            {/* <ToggleItem
              icon={darkMode ? <Moon /> : <Sun />}
              label="Dark Mode"
              enabled={darkMode}
              onToggle={handleThemeToggle}
            /> */}
          </div>
        </section>

        {/* Storage */}
        <section>
          <h3 className="text-lg font-bold mb-3">Storage & Media</h3>
          <SettingItem
            icon={<Trash2 />}
            label="Clear Media Cache"
            onClick={() => alert("Media cache cleared!")}
          />
        </section>

        {/* Logout */}
        <section>
          <button
            onClick={logout}
            className="w-full mt-6 flex justify-center items-center cursor-pointer gap-2 bg-red-600 hover:bg-red-700 py-2 rounded-md font-semibold"
          >
            <LogOut size={18} /> Logout
          </button>
        </section>

        {/* Danger Zone — Delete Account */}
        <section>
          <h3 className="text-lg font-bold mb-3 text-red-500">⚠️ Danger Zone</h3>
          <div
            onClick={() => setDeleteAccountOpen(true)}
            className="flex justify-between items-center bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800 hover:border-red-500 rounded-lg px-4 py-3 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} />
              <span className="font-medium">Delete Account</span>
            </div>
            <ChevronRight size={16} />
          </div>
          <p className="text-xs text-[var(--foreground)]/40 mt-2">
            This will permanently delete your account, messages, friends, and all data. This action cannot be undone.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="text-center text-[var(--foreground)]/30 text-sm py-4 border-t border-gray-700">
        Gappo Chat App • v1.0.0
      </div>

      {/* Change Password Modal */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${changePasswordOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Change Password</h2>
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="text-[var(--foreground)] text-2xl cursor-pointer hover:text-red-500 transition"
            >
              &times;
            </button>
          </div>
          <ChangePasswordForm onClose={() => setChangePasswordOpen(false)} />
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity ${deleteAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-[var(--background)] border border-red-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-500">🗑️ Delete Account</h2>
            <button
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
              }}
              className="text-[var(--foreground)] text-2xl cursor-pointer hover:text-red-500 transition"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-[var(--foreground)]/70 mb-2">
            This action is <strong className="text-red-400">permanent and irreversible</strong>. All your data including messages, friends, and groups will be deleted.
          </p>
          <p className="text-sm text-[var(--foreground)]/70 mb-4">
            Type <strong className="text-red-400 font-mono">DELETE</strong> below to confirm:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full px-3 py-2 rounded-md bg-[var(--card)] border border-red-800 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-red-500 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
              }}
              className="flex-1 py-2 rounded-md cursor-pointer bg-[var(--card)] border border-[var(--foreground)]/30 hover:bg-[var(--accent)]/15 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleting}
              className={`flex-1 py-2 rounded-md cursor-pointer font-semibold text-sm transition ${deleteConfirmText === "DELETE" && !deleting
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-900/30 text-red-800 cursor-not-allowed"
                }`}
            >
              {deleting ? "Deleting..." : "Delete My Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function SettingItem({ icon, label, action, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="flex justify-between items-center bg-[var(--card)] hover:bg-[var(--accent)]/15 text-[var(--foreground)] border border-[var(--foreground)] hover:border-[var(--accent)] rounded-lg px-4 py-3 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="text-lime-400">{icon}</div>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        {action && <span>{action}</span>}
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

function ToggleItem({ icon, label, enabled, onToggle }: any) {
  return (
    <div className="flex justify-between items-center cursor-pointer bg-[var(--card)] hover:bg-[var(--accent)]/15 border border-[var(--foreground)] hover:border-[var(--accent)] rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="text-lime-400">{icon}</div>
        <span>{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 flex items-center rounded-full transition ${enabled ? "bg-[var(--accent)]" : "bg-gray-500"
          }`}
      >
        <div
          className={`w-5 h-5 bg-[var(--background)] rounded-full shadow transform transition ${enabled ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}
