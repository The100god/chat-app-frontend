"use client"
import { useAuth } from "../context/AuthContext";
import {
  FaUserFriends,
  FaBell,
  FaUsers,
  FaCog,
  FaSearch,
  FaHome,
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import Link from "next/link";
import { useAtom } from "jotai";
import {
  allFriendsAtom,
  findFriendAtom,
  findFriendWithChatAtom,
  friendsCountsAtom,
  friendsRequestsAtom,
  groupChatOpenAtom,
  loadingMessageAtom,
  messageAtom,
  selectedFriendAtom,
  userAtom,
} from "../states/States";
import NotificationBell from "./NotificationBell";
// import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [, setFindFriend] = useAtom(findFriendAtom);
  const [, setFindFriendWithChat] = useAtom(findFriendWithChatAtom);
  const [, setFriendsRequests] = useAtom(friendsRequestsAtom);
  const [, setAllFriends] = useAtom(allFriendsAtom);
  const [, setGroupChatOpen] = useAtom(groupChatOpenAtom);
  const [friendsCounts] = useAtom(friendsCountsAtom);
  const [, setMessages] = useAtom(messageAtom);
  const [, setLoadingMessages] = useAtom(loadingMessageAtom);
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);
  
    const [user] = useAtom(userAtom);


  // const headerRef = useRef<HTMLDivElement>(null);
  // const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
  // const [isHovered, setIsHovered] = useState(false);
  // const [canAnimate, setCanAnimate] = useState(false);
  // const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // const handleMouseMove = (e: React.MouseEvent) => {
  //   if (!canAnimate || !headerRef.current) return;

  //   const rect = headerRef.current.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;
  //   const centerX = rect.width / 2;
  //   const centerY = rect.height / 2;

  //   const offsetX = x - centerX;
  //   const offsetY = y - centerY;

  //   const rotateY = -(offsetX / centerX) * 15;
  //   const rotateX = (offsetY / centerY) * 15;

  //   setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  // };

  // const handleMouseEnter = () => {
  //   setIsHovered(true);
  //   hoverTimeout.current = setTimeout(() => {
  //     setCanAnimate(true);
  //   }, 500); // 1 second delay
  // };

  // const handleMouseLeave = () => {
  //   if (hoverTimeout.current) {
  //     clearTimeout(hoverTimeout.current);
  //     hoverTimeout.current = null;
  //   }
  //   setTransform("rotateX(0deg) rotateY(0deg)");
  //   setCanAnimate(false);
  //   setIsHovered(false);
  // };

  // useEffect(() => {
  //   return () => {
  //     if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  //   };
  // }, []);

  if (!isAuthenticated) {
    return null; // Don't show header if not authenticated
  }
  // Dummy data (replace with real data from backend)
  const friendCount = friendsCounts;
  const profilePic = user.profilePic || "/user.jpg"; // Dummy profile image
  return (
    <header className="w-full bg-[var(--background)] text-[var(--foreground) shadow-md py-4 px-6 flex justify-between items-center">
      <div
        // ref={headerRef}
        className={`relative w-[80%] m-auto h-20 rounded-4xl flex items-center justify-around bg-[var(--card)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow`}

        // className={`relative w-[80%] m-auto h-20 rounded-4xl flex items-center justify-around
        //   transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] 
        //   ${isHovered ? "glow" : ""}
        // `}
        // style={{
        //   transform,
        //   transformStyle: "preserve-3d",
        //   perspective: "1000px",
        //   background:
        //     "linear-gradient(135deg, rgb(8 22 53), rgb(2 8 32)), radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1), transparent 40%)",
        //   backgroundBlendMode: "overlay",
        // }}
        // onMouseMove={handleMouseMove}
        // onMouseEnter={handleMouseEnter}
        // onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 pointer-events-none shimmer-mask rounded-4xl z-0" />

        {/* Left Section */}
        <div className="flex items-center space-x-6">
          {/* Profile Picture */}
          <Link href="/pages/profilePage">
            <img
              src={profilePic}
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-[var(--accent)] hover:opacity-80"
            />
          </Link>

          <div
            onClick={() => {
              setFindFriend(false);
              setFriendsRequests(false);
              setAllFriends(false);
              setGroupChatOpen(false);
              setFindFriendWithChat(true);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
          >
            <div className="text-2xl font-bold cursor-pointer text-[var(--accent)] transition flex items-center space-x-2">
              {/* Gappo */}
              Chugli
            </div>
          </div>
        </div>

        {/* Center Section - Gappo Logo */}
        <div className="w-1/2 flex justify-around">
          {/* Home */}
          <div
            onClick={() => {
              setFindFriend(false);
              setFriendsRequests(false);
              setAllFriends(false);
              setGroupChatOpen(false);
              setFindFriendWithChat(true);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaHome size={24} />
            <span>Home</span>
          </div>
          {/* find Friend */}
          <div
            onClick={() => {
              setFindFriend(true);
              setFriendsRequests(false);
              setAllFriends(false);
              setGroupChatOpen(false);
              setFindFriendWithChat(false);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaSearch size={24} />
            <span>Find Friends</span>
          </div>
          {/* Friend Requests */}
          <div
            onClick={() => {
              setFindFriend(false);
              setFriendsRequests(true);
              setAllFriends(false);
              setGroupChatOpen(false);
              setFindFriendWithChat(false);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
            className="flex relative cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaBell size={24} />
            <span>Requests</span>
            <div className="absolute top-[-10px] left-8">
              <NotificationBell />
            </div>
          </div>

          {/* Friends Count */}
          <div
            onClick={() => {
              setFindFriend(false);
              setFriendsRequests(false);
              setAllFriends(true);
              setGroupChatOpen(false);
              setFindFriendWithChat(false);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaUserFriends size={24} />
            <span>{friendCount} Friends</span>
          </div>

          {/* Groups */}
          <div
            onClick={() => {
              setFindFriend(false);
              setFriendsRequests(false);
              setAllFriends(false);
              setGroupChatOpen(true);
              setFindFriendWithChat(false);
              setMessages([]);
              setLoadingMessages(true);
              setSelectedFriend(null);
              router.push("/");
            }}
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaUsers size={24} />
            <span>Groups</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Settings */}
          <Link href="/pages/settings" className="hover:text-[var(--accent)]">
            <FaCog className="hover:rotate-90 transition duration-200" size={24} />
          </Link>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center cursor-pointer space-x-2 bg-red-500 border-2 border-black hover:border-red-800 text-[var(--foreground)] px-3 py-2 rounded-lg hover:bg-red-400"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
