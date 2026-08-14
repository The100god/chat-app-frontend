"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaUserFriends,
  FaBell,
  FaUsers,
  FaCog,
  FaSearch,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { useAtom } from "jotai";
import {
  activeWorkspaceAtom,
  allFriendsAtom,
  findFriendAtom,
  findFriendWithChatAtom,
  friendsCountsAtom,
  friendsRequestsAtom,
  groupChatOpenAtom,
  loadingMessageAtom,
  messageAtom,
  responsiveDeviceAtom,
  selectedFriendAtom,
  updateAvailableAtom,
  userAtom,
} from "../states/States";
import NotificationBell from "./NotificationBell";
import { Gamepad2, MessageCircle } from "lucide-react";

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [findFriend, setFindFriend] = useAtom(findFriendAtom);
  const [findFriendWithChat, setFindFriendWithChat] = useAtom(findFriendWithChatAtom);
  const [friendsRequests, setFriendsRequests] = useAtom(friendsRequestsAtom);
  const [allFriends, setAllFriends] = useAtom(allFriendsAtom);
  const [groupChatOpen, setGroupChatOpen] = useAtom(groupChatOpenAtom);
  const [friendsCounts] = useAtom(friendsCountsAtom);
  const [, setMessages] = useAtom(messageAtom);
  const [, setLoadingMessages] = useAtom(loadingMessageAtom);
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [user] = useAtom(userAtom);
  const [updateAvailable] = useAtom(updateAvailableAtom);
  const router = useRouter();
  const [showLeft, setShowLeft] = useAtom(responsiveDeviceAtom);
  const [activeWorkspace, setActiveWorkspace] = useAtom(activeWorkspaceAtom);

  const isHomeActive = findFriendWithChat && !findFriend && !friendsRequests && !allFriends && !groupChatOpen;
  const isFindFriendsActive = findFriend;
  const isRequestsActive = friendsRequests;
  const isFriendsActive = allFriends;
  const isGroupsActive = groupChatOpen;

  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (!isAuthenticated) return null;

  const friendCount = friendsCounts;
  const profilePic = user.profilePic || "/user.jpg";

  const handleNav = (cb: () => void) => {
    cb();
    setMessages([]);
    setLoadingMessages(true);
    setSelectedFriend(null);
    setMenuOpen(false);
    setShowLeft(true);
    setActiveWorkspace("chat");
    router.push("/");
  };

  const handleWorkspaceSwitch = (workspace: "chat" | "together") => {
    setActiveWorkspace(workspace);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeWorkspace", workspace);
    }
    setMenuOpen(false);
    if (workspace === "chat") {
      setFindFriendWithChat(true);
      setFindFriend(false);
      setFriendsRequests(false);
      setAllFriends(false);
      setGroupChatOpen(false);
      setShowLeft(true);
    }
    router.push(`/?workspace=${workspace}`);
  };

  const isMobileChatOpen = activeWorkspace === "chat" && !showLeft;

  return (
    <header className={`w-full bg-[var(--background)] text-[var(--foreground)] py-2.5 px-3 sm:px-6 shadow-sm border-b border-[var(--border)] transition-colors ${isMobileChatOpen ? "hidden lg:block" : "block"}`}>
      {/* Desktop Header Bar (WhatsApp Web style) */}
      <div className="hidden lg:flex w-full max-w-7xl px-4 m-auto h-16 rounded-2xl items-center justify-between bg-[var(--card)] border border-[var(--border)] shadow-sm transition-all duration-300">
        {/* Left Section: Profile + Logo + Workspace Toggle */}
        <div className="flex items-center space-x-4">
          <Link href="/pages/profilePage" className="relative group">
            <Image
              src={profilePic || "/user.jpg"}
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-[var(--accent)] hover:scale-105 transition-transform object-cover"
              width={40}
              height={40}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[var(--card)] rounded-full"></span>
          </Link>
          
          <div
            onClick={() =>
              handleNav(() => {
                setFindFriendWithChat(true);
                setFindFriend(false);
                setFriendsRequests(false);
                setAllFriends(false);
                setGroupChatOpen(false);
              })
            }
            className="text-xl font-bold cursor-pointer text-[var(--accent)] tracking-tight flex items-center space-x-1.5 hover:opacity-90"
          >
            <span>Chugli</span>
          </div>

          {/* Workspace Switcher Pill */}
          <div className="flex items-center bg-[var(--muted)] rounded-full p-1 border border-[var(--border)] ml-2">
            <button
              onClick={() => handleWorkspaceSwitch("chat")}
              aria-label="Switch to Chat workspace"
              title="Chat Workspace"
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeWorkspace === "chat"
                  ? "text-white"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              {activeWorkspace === "chat" && (
                <motion.div
                  layoutId="workspace-pill"
                  className="absolute inset-0 bg-[var(--accent)] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <MessageCircle size={14} className="relative z-10" />
              <span className="relative z-10">Chat</span>
            </button>
            <button
              onClick={() => handleWorkspaceSwitch("together")}
              aria-label="Switch to Together workspace"
              title="Together Workspace"
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer z-10 ${
                activeWorkspace === "together"
                  ? "text-white"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              {activeWorkspace === "together" && (
                <motion.div
                  layoutId="workspace-pill"
                  className="absolute inset-0 bg-[var(--accent)] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Gamepad2 size={14} className="relative z-10" />
              <span className="relative z-10">Together</span>
            </button>
          </div>
        </div>

        {/* Center Section: WhatsApp style Filter Tabs */}
        {activeWorkspace === "chat" && (
          <div className="flex items-center bg-[var(--muted)]/60 p-1 rounded-full border border-[var(--border)] gap-1">
            <button
              onClick={() =>
                handleNav(() => {
                  setFindFriendWithChat(true);
                  setFindFriend(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                })
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isHomeActive
                  ? "bg-[var(--accent)] text-white shadow-sm font-semibold"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)]"
              }`}
            >
              <FaHome size={14} />
              <span>Chats</span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setFindFriend(true);
                  setFindFriendWithChat(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                })
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isFindFriendsActive
                  ? "bg-[var(--accent)] text-white shadow-sm font-semibold"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)]"
              }`}
            >
              <FaSearch size={14} />
              <span>Find</span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setFindFriend(false);
                  setFindFriendWithChat(false);
                  setFriendsRequests(true);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                })
              }
              className={`flex relative items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isRequestsActive
                  ? "bg-[var(--accent)] text-white shadow-sm font-semibold"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)]"
              }`}
            >
              <FaBell size={14} />
              <span>Requests</span>
              <NotificationBell />
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setAllFriends(true);
                  setFindFriend(false);
                  setFindFriendWithChat(false);
                  setFriendsRequests(false);
                  setGroupChatOpen(false);
                })
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isFriendsActive
                  ? "bg-[var(--accent)] text-white shadow-sm font-semibold"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)]"
              }`}
            >
              <FaUserFriends size={14} />
              <span>Friends ({friendCount})</span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setGroupChatOpen(true);
                  setFindFriend(false);
                  setFindFriendWithChat(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                })
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isGroupsActive
                  ? "bg-[var(--accent)] text-white shadow-sm font-semibold"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--card)]"
              }`}
            >
              <FaUsers size={14} />
              <span>Groups</span>
            </button>
          </div>
        )}

        {/* Right Section: Action Buttons */}
        <div className="flex items-center space-x-3">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center cursor-pointer space-x-1.5 bg-[var(--accent)] hover:opacity-90 text-white px-3 py-1.5 rounded-xl shadow-xs transition text-xs font-semibold"
              title="Install App"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>Install App</span>
            </button>
          )}

          <Link href="/pages/settings" className="relative p-2 text-[var(--foreground)] hover:text-[var(--accent)] transition-colors" title="Settings">
            <FaCog className="hover:rotate-90 transition-transform duration-300" size={19} />
            {updateAvailable && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </Link>

          <button
            onClick={logout}
            className="flex items-center cursor-pointer space-x-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-3 py-1.5 rounded-xl transition text-xs font-medium"
            title="Logout"
          >
            <MdLogout size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Header (WhatsApp Mobile Top Bar & Tab Strip) */}
      <div className="lg:hidden flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]/50">
          <div className="flex items-center space-x-2.5">
            <Link href="/pages/profilePage" className="relative">
              <Image
                src={profilePic || "/user.jpg"}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-[var(--accent)] object-cover"
                width={32}
                height={32}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
            </Link>
            <span
              className="text-lg font-bold text-[var(--accent)] cursor-pointer tracking-tight"
              onClick={() =>
                handleNav(() => {
                  setFindFriendWithChat(true);
                  setFindFriend(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                  setShowLeft(true);
                  router.push("/");
                })
              }
            >
              Chugli
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Workspace Switcher for Mobile Header */}
            <div className="flex items-center bg-[var(--muted)] rounded-full p-0.5 border border-[var(--border)]">
              <button
                onClick={() => handleWorkspaceSwitch("chat")}
                title="Chat Workspace"
                className={`p-1 rounded-full transition-all cursor-pointer ${
                  activeWorkspace === "chat" ? "bg-[var(--accent)] text-white shadow-xs" : "text-[var(--foreground)] opacity-60"
                }`}
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={() => handleWorkspaceSwitch("together")}
                title="Together Workspace"
                className={`p-1 rounded-full transition-all cursor-pointer ${
                  activeWorkspace === "together" ? "bg-[var(--accent)] text-white shadow-xs" : "text-[var(--foreground)] opacity-60"
                }`}
              >
                <Gamepad2 size={14} />
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-[var(--foreground)] cursor-pointer" title="Menu">
              {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* WhatsApp Mobile Tab Navigation Strip */}
        {activeWorkspace === "chat" && (
          <div className="flex items-center overflow-x-auto no-scrollbar px-2 py-1.5 bg-[var(--muted)]/40 border-t border-[var(--border)]/30 gap-1">
            <button
              onClick={() =>
                handleNav(() => {
                  setFindFriendWithChat(true);
                  setFindFriend(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                  setShowLeft(true);
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isHomeActive
                  ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              Chats
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setFindFriend(true);
                  setFindFriendWithChat(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                  setShowLeft(true);
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isFindFriendsActive
                  ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              Find
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setFriendsRequests(true);
                  setFindFriendWithChat(false);
                  setFindFriend(false);
                  setAllFriends(false);
                  setGroupChatOpen(false);
                  setShowLeft(true);
                })
              }
              className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isRequestsActive
                  ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              Requests
              <NotificationBell />
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setAllFriends(true);
                  setFindFriendWithChat(false);
                  setFindFriend(false);
                  setFriendsRequests(false);
                  setGroupChatOpen(false);
                  setShowLeft(true);
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isFriendsActive
                  ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              Friends ({friendCount})
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setGroupChatOpen(true);
                  setFindFriendWithChat(false);
                  setFindFriend(false);
                  setFriendsRequests(false);
                  setAllFriends(false);
                  setShowLeft(true);
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isGroupsActive
                  ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                  : "text-[var(--foreground)] opacity-70 hover:opacity-100"
              }`}
            >
              Groups
            </button>
          </div>
        )}
      </div>

      {/* Floating Top-Right Mobile Dropdown Menu (Upper Layer z-50) */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50">
            {/* Click Outside Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/20"
            />

            {/* Top-Right Upper Layer Dropdown Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ transformOrigin: "top right" }}
              className="fixed top-14 right-3 z-50 w-56 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-2 shadow-2xl flex flex-col space-y-1 select-none"
            >
              {/* User Profile Quick Item */}
              <Link
                href="/pages/profilePage"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--muted)]/40 hover:bg-[var(--muted)] border border-[var(--border)]/40 transition cursor-pointer"
              >
                <Image
                  src={profilePic || "/user.jpg"}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-[var(--accent)] object-cover"
                  width={36}
                  height={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">
                    {user.username || "Profile"}
                  </p>
                  <p className="text-[10px] text-[var(--accent)] font-medium">View Profile</p>
                </div>
              </Link>

              {/* Install App Button */}
              {isInstallable && (
                <button
                  onClick={() => {
                    handleInstallClick();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/15 transition cursor-pointer text-xs"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Install App</span>
                </button>
              )}

              {/* Settings Link */}
              <Link
                href="/pages/settings"
                onClick={() => {
                  setMenuOpen(false);
                  setShowLeft(true);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[var(--foreground)] hover:bg-[var(--muted)] transition text-xs font-medium"
              >
                <div className="flex items-center space-x-2.5">
                  <FaCog className="text-[var(--foreground)] opacity-70" size={15} />
                  <span>Settings</span>
                </div>
                {updateAvailable && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    Update
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  setShowLeft(true);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs font-semibold"
              >
                <MdLogout size={16} />
                <span>Logout</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
