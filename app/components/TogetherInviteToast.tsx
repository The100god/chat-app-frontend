"use client";

import React from "react";
import { useAtom, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  togetherInvitesAtom,
  togetherRoomAtom,
  userIdAtom,
  isAppLockedAtom,
  pendingTogetherInviteAtom,
  activeWorkspaceAtom,
} from "../states/States";
import { useTogetherRoom } from "../hooks/useTogetherRoom";
import { Sparkles, Gamepad2, Film, Music, Brain, Heart, X, Check, Users } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  game: <Gamepad2 size={18} className="text-purple-400" />,
  watch: <Film size={18} className="text-red-400" />,
  music: <Music size={18} className="text-cyan-400" />,
  quiz: <Brain size={18} className="text-amber-400" />,
  activity: <Heart size={18} className="text-pink-400" />,
};

export default function TogetherInviteToast() {
  const [invites] = useAtom(togetherInvitesAtom);
  const [room] = useAtom(togetherRoomAtom);
  const [userId] = useAtom(userIdAtom);
  const [isAppLocked] = useAtom(isAppLockedAtom);
  const setPendingInvite = useSetAtom(pendingTogetherInviteAtom);
  const setActiveWorkspace = useSetAtom(activeWorkspaceAtom);
  const { joinRoom, dismissInvite } = useTogetherRoom();

  // If player is already inside an active room session, suppress invitation toasts
  if (room) return null;

  const validInvites = invites ? invites.filter((i) => i.hostId !== userId) : [];

  if (validInvites.length === 0) return null;

  // Display the latest invite in the toast stack
  const latestInvite = validInvites[0];

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomId = latestInvite.roomId;
    dismissInvite(roomId);
    setActiveWorkspace("together");

    if (isAppLocked) {
      setPendingInvite({ roomId });
    } else {
      joinRoom(roomId);
    }
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissInvite(latestInvite.roomId);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissInvite(latestInvite.roomId);
  };

  const handleCardClick = () => {
    setActiveWorkspace("together");
  };

  const icon = typeIcons[latestInvite.roomType] || (
    <Sparkles size={18} className="text-[var(--accent)]" />
  );

  return (
    <AnimatePresence>
      <motion.div
        key={latestInvite.roomId}
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        onClick={handleCardClick}
        className="relative fixed top-4 right-4 z-[9990] max-w-sm w-full bg-[var(--card)] border border-[var(--accent)]/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md cursor-pointer hover:border-[var(--accent)]/60 transition-colors pr-9"
      >
        {/* Top-Right Close Popup Button */}
        <button
          onClick={handleClose}
          aria-label="Close notification"
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-[var(--foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--muted)] transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          {/* Avatar or Icon */}
          <div className="relative flex-shrink-0">
            {latestInvite.hostProfilePic ? (
              <img
                src={latestInvite.hostProfilePic}
                alt={latestInvite.hostUsername}
                className="w-10 h-10 rounded-full object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 flex items-center justify-center font-bold text-[var(--accent)]">
                {latestInvite.hostUsername.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-[var(--card)] p-1 rounded-full border border-[var(--border)]">
              {icon}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm font-bold text-[var(--foreground)] truncate">
                Together Session Invite
              </h4>
              {validInvites.length > 1 && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold bg-[var(--accent)] text-white px-2 py-0.5 rounded-full flex-shrink-0 mr-4">
                  <Users size={10} /> +{validInvites.length - 1} more
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--foreground)] opacity-70 mt-0.5">
              <span className="font-semibold text-[var(--foreground)]">
                {latestInvite.hostUsername}
              </span>{" "}
              invited you to join a {latestInvite.roomType} session!
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow"
              >
                <Check size={14} />
                Join Now
              </button>
              <button
                onClick={handleDecline}
                className="flex items-center justify-center px-3 py-1.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                <X size={14} />
                Decline
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
