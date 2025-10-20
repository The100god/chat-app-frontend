"use client";
import { Eye, EyeClosed } from "lucide-react";
import React, { useEffect, useState } from "react";

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ChangePasswordForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const [seeNewPassword, setSeeNewPassword] = useState(false);
  const [seeCurrentPassword, setSeeCurrentPassword] = useState(false);

  const API_BASE = `${backendUrl}/api/users`; // change if required

  useEffect(() => {
    return () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
      setMessage(null);
      setError(null);
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);


    // Basic client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all fields");
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    // New password rules (example: min 6 chars and have incude special char and number and letters)
    if (
      newPassword.length < 6 ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[a-zA-Z]/.test(newPassword)
    ) {
      setError(
        "New password must be at least 6 characters and include a special character, a number, and letters"
      );
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("chatAppToken");
      const res = await fetch(`${API_BASE}/changePassword`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      // Success: update token if returned
      if (data.token) {
        localStorage.setItem("chatAppToken", data.token);
      }

      setMessage(data.message || "Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
      setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md p-4 bg-[var(--card)] rounded-md"
    >
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {message && <div className="text-green-400 mb-2">{message}</div>}

      <label className="block mb-2 text-sm text-[var(--foreground)]">
        Old Password
      </label>
      <div className="flex items-center gap-2">
        <input
          type={`${!seeCurrentPassword ? "password" : "text"}`}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full mb-3 p-2 bg-[var(--input)] border border-[var(--border)] rounded"
        />
        <span className="flex justify-center items-center p-2 mb-4 cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] rounded">
          {!seeCurrentPassword ? (
            <Eye
              onClick={() => setSeeCurrentPassword(!seeCurrentPassword)}
              size={20}
              className="text-[var(--accent)]"
            />
          ) : (
            <EyeClosed
              onClick={() => setSeeCurrentPassword(!seeCurrentPassword)}
              size={20}
              className="text-[var(--accent)]"
            />
          )}
        </span>
      </div>

      <label className="block mb-2 text-sm text-[var(--foreground)]">
        New Password
      </label>
      <div className="flex items-center gap-2">
        <input
          type={`${!seeNewPassword ? "password" : "text"}`}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full mb-3 p-2 bg-[var(--input)] border border-[var(--border)] rounded"
        />
        <div className="flex justify-center items-center p-2 mb-4 cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] rounded">
          {!seeNewPassword ? (
            <Eye
              onClick={() => setSeeNewPassword(!seeNewPassword)}
              size={20}
              className="text-[var(--accent)]"
            />
          ) : (
            <EyeClosed
              onClick={() => setSeeNewPassword(!seeNewPassword)}
              size={20}
              className="text-[var(--accent)]"
            />
          )}
        </div>
      </div>

      <label className="block mb-2 text-sm text-[var(--foreground)]">
        Confirm New Password
      </label>
      <div className="flex items-center gap-2">
        <input
          type={`${!seeConfirmPassword ? "password" : "text"}`}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-4 p-2 bg-[var(--input)] border border-[var(--border)] rounded"
        />

        <span className="flex justify-center items-center p-2 mb-4 cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] rounded">
          {!seeConfirmPassword ? (
            <Eye
              onClick={() => setSeeConfirmPassword(!seeConfirmPassword)}
              size={23}
              className="text-[var(--accent)]"
            />
          ) : (
            <EyeClosed
              onClick={() => setSeeConfirmPassword(!seeConfirmPassword)}
              size={23}
              className="text-[var(--accent)]"
            />
          )}
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/15 border border-[var(--background)] hover:border-[var(--accent)] text-[var(--card-foreground)] cursor-pointer rounded mr-2"
      >
        {loading ? "Saving..." : "Change Password"}
      </button>
      <button
      onClick={()=>onClose()}
        disabled={loading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700/15 text-[var(--card-foreground)] border border-[var(--background)] hover:border-red-600 cursor-pointer rounded"
      >
        {loading ? "Saving..." : "Close"}
      </button>
    </form>
  );
}
