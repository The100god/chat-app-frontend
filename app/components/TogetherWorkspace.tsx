"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Film,
  Music,
  Brain,
  Heart,
  Home,
  Sparkles,
  Plus,
  LogIn,
  Send,
  UserCheck,
  Users,
  Check,
  X,
  Zap,
  RotateCcw,
} from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import {
  friendsAtom,
  isAppLockedAtom,
  pendingTogetherInviteAtom,
} from "../states/States";
import { useTogetherRoom } from "../hooks/useTogetherRoom";
import { TogetherRoom, TogetherRoomType, TogetherInvite, TogetherGameId, TogetherActivityId } from "../states/togetherTypes";
import TogetherRoomShell from "./TogetherRoomShell";
import { ActivitySelector } from "./activities/ActivitySelector";

type TogetherSection = "home" | "games" | "watch" | "listen" | "quiz" | "activities";

interface SectionInfo {
  id: TogetherSection;
  label: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  color: string;
  roomType: TogetherRoomType;
}

const sections: SectionInfo[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    emoji: "🏠",
    description: "Your Together hub — everything starts here.",
    color: "var(--accent)",
    roomType: "game",
  },
  {
    id: "games",
    label: "Games",
    icon: <Gamepad2 size={20} />,
    emoji: "🎮",
    description: "Play fun games together with your partner in real-time.",
    color: "#8b5cf6",
    roomType: "game",
  },
  {
    id: "watch",
    label: "Watch Together",
    icon: <Film size={20} />,
    emoji: "🎬",
    description: "Watch videos in sync — pause, play, and react together.",
    color: "#ef4444",
    roomType: "watch",
  },
  {
    id: "listen",
    label: "Listen Together",
    icon: <Music size={20} />,
    emoji: "🎵",
    description: "Share and listen to music together in real-time.",
    color: "#06b6d4",
    roomType: "music",
  },
  // {
  //   id: "quiz",
  //   label: "Couple Quiz",
  //   icon: <Brain size={20} />,
  //   emoji: "🧠",
  //   description: "Test how well you know each other with fun quizzes.",
  //   color: "#f59e0b",
  //   roomType: "quiz",
  // },
  {
    id: "activities",
    label: "Activities",
    icon: <Heart size={20} />,
    emoji: "❤️",
    description: "Discover fun activities and challenges for couples.",
    color: "#ec4899",
    roomType: "activity",
  },
];

import { GameSelector } from "./games/GameSelector";

const roomSectionMap: Record<TogetherRoomType, TogetherSection> = {
  watch: "watch",
  music: "listen",
  game: "games",
  activity: "activities",
  quiz: "home",
};

const TogetherWorkspace: React.FC = () => {
  const [activeSection, setActiveSection] = useState<TogetherSection>("home");
  const [isMobile, setIsMobile] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");

  // Create & Invite state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingRoomType, setPendingRoomType] = useState<TogetherRoomType>("game");
  const [selectedGameId, setSelectedGameId] = useState<TogetherGameId | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const [friends] = useAtom(friendsAtom);
  const [isAppLocked] = useAtom(isAppLockedAtom);
  const setPendingInvite = useSetAtom(pendingTogetherInviteAtom);
  const { room, invites, dismissInvite, createRoom, joinRoom } = useTogetherRoom();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1025);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 1. Sync section from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const secParam = params.get("section") as TogetherSection | null;
    if (secParam && sections.some((s) => s.id === secParam)) {
      setActiveSection(secParam);
    }
  }, []);

  // 2. Sync activeSection to URL query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("section") !== activeSection) {
      url.searchParams.set("section", activeSection);
      window.history.replaceState({}, "", url.toString());
    }
  }, [activeSection]);

  // 3. Auto-sync activeSection when room changes (e.g. watch room -> watch section)
  useEffect(() => {
    if (room?.type) {
      const typeToSection: Record<TogetherRoomType, TogetherSection> = {
        watch: "watch",
        music: "listen",
        game: "games",
        activity: "activities",
        quiz: "home",
      };
      const targetSec = typeToSection[room.type];
      if (targetSec && activeSection !== targetSec) {
        setActiveSection(targetSec);
      }
    }
  }, [room?.type]);

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  const handleInitiateCreate = (type: TogetherRoomType) => {
    setPendingRoomType(type);
    const typeToSection: Record<TogetherRoomType, TogetherSection> = {
      watch: "watch",
      music: "listen",
      game: "games",
      activity: "activities",
      quiz: "home",
    };
    if (typeToSection[type]) {
      setActiveSection(typeToSection[type]);
    }
    if (type === "activity" && !selectedGameId) {
      setSelectedGameId("would_you_rather" as unknown as TogetherGameId);
    }
    setSelectedFriendId(friends.length > 0 ? friends[0].friendId : null);
    setShowCreateModal(true);
  };

  const handleConfirmCreate = (inviteFriend: boolean) => {
    const targetUserId = inviteFriend && selectedFriendId ? selectedFriendId : undefined;
    const gameOrActId = (pendingRoomType === "game" || pendingRoomType === "activity")
      ? (selectedGameId || undefined)
      : (pendingRoomType === "quiz" ? "quiz" : undefined);
    createRoom(pendingRoomType, gameOrActId, targetUserId);
    setShowCreateModal(false);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      joinRoom(joinRoomId.trim());
      setJoinRoomId("");
      setShowJoinModal(false);
    }
  };

  const handleAcceptInvite = (invite: TogetherInvite) => {
    const roomId = invite.roomId;
    dismissInvite(roomId);
    setShowJoinModal(false);

    if (isAppLocked) {
      setPendingInvite({ roomId });
    } else {
      joinRoom(roomId);
    }
  };

  const handleDeclineInvite = (roomId: string) => {
    dismissInvite(roomId);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--background)]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <nav
          className="flex flex-col w-[260px] min-w-[220px] bg-[var(--card)] border-r border-[var(--border)] p-4 gap-1"
          aria-label="Together workspace navigation"
        >
          <div className="flex items-center gap-2 px-3 py-3 mb-4">
            <Sparkles size={22} className="text-[var(--accent)]" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Together
            </h2>
          </div>

          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                aria-label={section.label}
                aria-current={isActive ? "page" : undefined}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer w-full text-left
                  ${isActive
                    ? "text-[var(--card-foreground)] bg-[var(--accent)]/15"
                    : "text-[var(--foreground)] hover:bg-[var(--muted)] opacity-75 hover:opacity-100"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="together-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-full"
                    style={{ backgroundColor: section.color }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{
                    backgroundColor: isActive
                      ? `${section.color}20`
                      : "transparent",
                    color: isActive ? section.color : "inherit",
                  }}
                >
                  {section.icon}
                </span>
                <span className="flex-1">{section.label}</span>

                {/* Show badge on sidebar item if there are invites for that type */}
                {section.id !== "home" && invites.some((i) => i.roomType === section.roomType) && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Tab Bar */}
        {isMobile && (
          <nav
            className="flex items-center gap-1 px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] overflow-x-auto"
            aria-label="Together workspace navigation"
          >
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const hasTypeInvites = section.id !== "home" && invites.some((i) => i.roomType === section.roomType);
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  aria-label={section.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                    whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0
                    ${isActive
                      ? "text-white"
                      : "text-[var(--foreground)] opacity-60 hover:opacity-100 hover:bg-[var(--muted)]"
                    }
                  `}
                  style={
                    isActive
                      ? { backgroundColor: section.color }
                      : undefined
                  }
                >
                  <span className="text-sm">{section.emoji}</span>
                  <span>{section.id === "home" ? "Home" : section.label.split(" ")[0]}</span>
                  {hasTypeInvites && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Section Content */}
        <div className="flex-1 flex items-start justify-center p-3 sm:p-6 overflow-y-auto scrollbar-none">
          <AnimatePresence mode="wait">
            {room && (activeSection === (roomSectionMap[room.type] || "games")) ? (
              <motion.div
                key="room-shell"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl sm:max-w-3xl"
              >
                <TogetherRoomShell />
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-3xl lg:max-w-5xl flex flex-col gap-6"
              >
                {/* Active Session Banner if in room but viewing another tab */}
                {room && roomSectionMap[room.type] && (
                  <div className="w-full bg-gradient-to-r from-[var(--accent)]/20 via-purple-500/20 to-pink-500/20 border border-[var(--accent)]/40 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-[var(--accent)] animate-pulse" />
                      <span className="text-xs font-bold text-[var(--foreground)] capitalize">
                        Active {room.type} session in progress
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveSection(roomSectionMap[room.type])}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      Return to {sections.find((s) => s.id === roomSectionMap[room.type])?.label || "Session"}
                    </button>
                  </div>
                )}

                {/* Active & Rejoinable Room Sessions Card List */}
                {invites.length > 0 && (
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <Zap size={16} className="text-[var(--accent)]" />
                        Active & Rejoinable Sessions ({invites.length})
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {invites.map((inv) => (
                        <motion.div
                          key={inv.roomId}
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full bg-gradient-to-r from-[var(--accent)]/15 via-purple-500/15 to-pink-500/15 border border-[var(--accent)]/40 rounded-2xl p-3.5 shadow-md flex items-center gap-3"
                        >
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {inv.hostProfilePic ? (
                              <img
                                src={inv.hostProfilePic}
                                alt={inv.hostUsername}
                                className="w-10 h-10 rounded-full object-cover border border-[var(--accent)]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow">
                                {inv.hostUsername.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                          </div>

                          {/* Host & Activity info */}
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                              {inv.hostUsername}'s Session
                            </h4>
                            <p className="text-[11px] text-[var(--foreground)] opacity-75 truncate">
                              Active <span className="font-semibold text-[var(--accent)] capitalize">{inv.roomType}</span> room — tap to join
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleAcceptInvite(inv)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              <RotateCcw size={13} />
                              Join
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(inv.roomId)}
                              className="p-1.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--border)] transition-colors cursor-pointer"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "home" ? (
                  <HomeSection
                    onCreateRoom={handleInitiateCreate}
                    onJoinRoom={() => setShowJoinModal(true)}
                    invitesCount={invites.length}
                  />
                ) : activeSection === "games" ? (
                  <GameSelector
                    selectedGameId={selectedGameId}
                    userStats={(room as TogetherRoom | null)?.sessionStats}
                    onSelectGame={(gameId) => {
                      setSelectedGameId(gameId);
                      setPendingRoomType("game");
                      if (friends.length > 0) {
                        setSelectedFriendId(friends[0].friendId);
                        setShowCreateModal(true);
                      } else {
                        createRoom("game", gameId);
                      }
                    }}
                  />
                ) : activeSection === "activities" ? (
                  <ActivitySelector
                    onSelectActivity={(activityId) => {
                      setSelectedGameId(activityId as unknown as TogetherGameId);
                      setPendingRoomType("activity");
                      if (friends.length > 0) {
                        setSelectedFriendId(friends[0].friendId);
                        setShowCreateModal(true);
                      } else {
                        createRoom("activity", activityId);
                      }
                    }}
                  />
                ) : (
                  <ComingSoonCard
                    section={currentSection}
                    onCreateRoom={() => handleInitiateCreate(currentSection.roomType)}
                    onJoinRoom={() => setShowJoinModal(true)}
                    invitesCount={invites.filter((i) => i.roomType === currentSection.roomType).length}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create & Invite Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[var(--border)]"
            >
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
                <Plus size={20} className="text-[var(--accent)]" />
                Create Together Session
              </h3>
              <p className="text-xs text-[var(--foreground)] opacity-60 mb-3">
                Select the session type and a friend to invite into your Together session.
              </p>

              {/* 1. Room Type Selector Grid */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider block mb-1.5 opacity-70">
                  1. Select Activity Type:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sections.slice(1).map((sec) => {
                    const isSelected = pendingRoomType === sec.roomType;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setPendingRoomType(sec.roomType)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${isSelected
                          ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)] shadow-sm scale-[1.02]"
                          : "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] opacity-60 hover:opacity-100"
                          }`}
                      >
                        <span className="text-lg mb-0.5">{sec.emoji}</span>
                        <span className="truncate max-w-full">{sec.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Friend Selector List */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider block mb-1.5 opacity-70">
                  2. Select Friend to Invite:
                </label>
                {friends.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto p-1 border border-[var(--border)] rounded-xl bg-[var(--muted)]/40">
                    {friends.map((friend) => {
                      const isSelected = selectedFriendId === friend.friendId;
                      return (
                        <button
                          key={friend.friendId}
                          type="button"
                          onClick={() => setSelectedFriendId(friend.friendId)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-left ${isSelected
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)]"
                            : "bg-[var(--card)] border-transparent text-[var(--foreground)] opacity-80 hover:opacity-100"
                            }`}
                        >
                          {friend.profilePic ? (
                            <img
                              src={friend.profilePic}
                              alt={friend.username}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-semibold flex-1 truncate">
                            {friend.username}
                          </span>
                          {isSelected && (
                            <UserCheck size={15} className="text-[var(--accent)] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[var(--muted)] text-center">
                    <Users size={20} className="mx-auto mb-1 opacity-50" />
                    <p className="text-[11px] text-[var(--foreground)] opacity-60">
                      No friends available to invite. You can still create a session and share the Room ID!
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {friends.length > 0 && (
                  <button
                    onClick={() => handleConfirmCreate(true)}
                    disabled={!selectedFriendId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow"
                  >
                    <Send size={16} />
                    Create & Send Invite ({pendingRoomType})
                  </button>
                )}

                <button
                  onClick={() => handleConfirmCreate(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium cursor-pointer hover:bg-[var(--border)] transition-colors"
                >
                  Create Without Inviting ({pendingRoomType})
                </button>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-1 text-xs text-[var(--foreground)] opacity-50 hover:opacity-80 transition-opacity cursor-pointer mt-0.5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[var(--border)] max-h-[85vh] flex flex-col"
            >
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
                <LogIn size={20} className="text-[var(--accent)]" />
                Join / Rejoin Room
              </h3>
              <p className="text-xs text-[var(--foreground)] opacity-60 mb-4">
                Rejoin an active room session, or enter a Room ID manually.
              </p>

              {/* List of Rejoinable Active Rooms if available */}
              {invites.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1">
                    <RotateCcw size={13} /> Active Sessions Open to Join ({invites.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                    {invites.map((inv) => (
                      <div
                        key={inv.roomId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">
                            {inv.hostUsername}'s Room
                          </p>
                          <p className="text-[10px] text-[var(--foreground)] opacity-60 capitalize">
                            {inv.roomType} session
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(inv)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
                        >
                          <RotateCcw size={12} />
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="my-1 border-t border-[var(--border)]" />
                </div>
              )}

              {/* Manual Room ID input */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[var(--foreground)] opacity-75">
                  Or enter Room ID manually:
                </span>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  placeholder="Paste room ID here..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] selectable-text"
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium cursor-pointer hover:bg-[var(--border)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={!joinRoomId.trim()}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Join via ID
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Home Section ─── */
const HomeSection: React.FC<{
  onCreateRoom: (type: TogetherRoomType) => void;
  onJoinRoom: () => void;
  invitesCount: number;
}> = ({ onCreateRoom, onJoinRoom, invitesCount }) => {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Hero */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--primary))",
        }}
      >
        <Sparkles size={44} className="text-white" />
      </motion.div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Welcome to Together
        </h1>
        <p className="text-sm text-[var(--foreground)] opacity-60 max-w-xs mx-auto">
          A shared space to play, watch, listen, and connect with the people you
          love. Pick an activity from the menu to get started!
        </p>
      </div>

      {/* Quick Actions next to each other: Create Room & Join Room */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => onCreateRoom("game")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Create Room
        </button>
        <button
          onClick={onJoinRoom}
          className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium cursor-pointer hover:bg-[var(--border)] transition-colors"
        >
          <LogIn size={16} />
          Join / Rejoin Room
          {invitesCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-[var(--accent)] text-white rounded-full animate-pulse shadow">
              {invitesCount}
            </span>
          )}
        </button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        {sections.slice(1).map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors"
            onClick={() => onCreateRoom(section.roomType)}
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white"
              style={{ backgroundColor: section.color }}
            >
              {section.icon}
            </span>
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                {section.label}
              </p>
              <p className="text-[10px] text-[var(--foreground)] opacity-50">
                Tap to create
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ─── Coming Soon Card (with Create/Join) ─── */
const ComingSoonCard: React.FC<{
  section: SectionInfo;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  invitesCount: number;
}> = ({ section, onCreateRoom, onJoinRoom, invitesCount }) => {
  return (
    <div className="flex flex-col items-center text-center gap-5 p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg">
      {/* Icon */}
      <motion.div
        initial={{ rotate: -10, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white"
        style={{ backgroundColor: section.color }}
      >
        <span className="text-4xl">{section.emoji}</span>
      </motion.div>

      {/* Text */}
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
          {section.label}
        </h2>
        <p className="text-sm text-[var(--foreground)] opacity-60 max-w-xs">
          {section.description}
        </p>
      </div>

      {/* Actions next to each other */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onCreateRoom}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: section.color }}
        >
          <Plus size={16} />
          Create
        </button>
        <button
          onClick={onJoinRoom}
          className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium cursor-pointer hover:bg-[var(--border)] transition-colors"
        >
          <LogIn size={16} />
          Join / Rejoin
          {invitesCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-[var(--accent)] text-white rounded-full animate-pulse shadow">
              {invitesCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default TogetherWorkspace;
