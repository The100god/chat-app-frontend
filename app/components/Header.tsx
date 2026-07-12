// "use client"
// import { useAuth } from "../context/AuthContext";
// import {
//   FaUserFriends,
//   FaBell,
//   FaUsers,
//   FaCog,
//   FaSearch,
//   FaHome,
// } from "react-icons/fa";
// import { MdLogout } from "react-icons/md";
// import Link from "next/link";
// import { useAtom } from "jotai";
// import {
//   allFriendsAtom,
//   findFriendAtom,
//   findFriendWithChatAtom,
//   friendsCountsAtom,
//   friendsRequestsAtom,
//   groupChatOpenAtom,
//   loadingMessageAtom,
//   messageAtom,
//   selectedFriendAtom,
//   userAtom,
// } from "../states/States";
// import NotificationBell from "./NotificationBell";
// // import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// const Header: React.FC = () => {
//   const { isAuthenticated, logout } = useAuth();
//   const [, setFindFriend] = useAtom(findFriendAtom);
//   const [, setFindFriendWithChat] = useAtom(findFriendWithChatAtom);
//   const [, setFriendsRequests] = useAtom(friendsRequestsAtom);
//   const [, setAllFriends] = useAtom(allFriendsAtom);
//   const [, setGroupChatOpen] = useAtom(groupChatOpenAtom);
//   const [friendsCounts] = useAtom(friendsCountsAtom);
//   const [, setMessages] = useAtom(messageAtom);
//   const [, setLoadingMessages] = useAtom(loadingMessageAtom);
//   const [, setSelectedFriend] = useAtom(selectedFriendAtom);
//   const [user] = useAtom(userAtom);
//   const router = useRouter();
//   const [menuOpen, setMenuOpen] = useState(false);

//   // const headerRef = useRef<HTMLDivElement>(null);
//   // const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
//   // const [isHovered, setIsHovered] = useState(false);
//   // const [canAnimate, setCanAnimate] = useState(false);
//   // const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

//   // const handleMouseMove = (e: React.MouseEvent) => {
//   //   if (!canAnimate || !headerRef.current) return;

//   //   const rect = headerRef.current.getBoundingClientRect();
//   //   const x = e.clientX - rect.left;
//   //   const y = e.clientY - rect.top;
//   //   const centerX = rect.width / 2;
//   //   const centerY = rect.height / 2;

//   //   const offsetX = x - centerX;
//   //   const offsetY = y - centerY;

//   //   const rotateY = -(offsetX / centerX) * 15;
//   //   const rotateX = (offsetY / centerY) * 15;

//   //   setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
//   // };

//   // const handleMouseEnter = () => {
//   //   setIsHovered(true);
//   //   hoverTimeout.current = setTimeout(() => {
//   //     setCanAnimate(true);
//   //   }, 500); // 1 second delay
//   // };

//   // const handleMouseLeave = () => {
//   //   if (hoverTimeout.current) {
//   //     clearTimeout(hoverTimeout.current);
//   //     hoverTimeout.current = null;
//   //   }
//   //   setTransform("rotateX(0deg) rotateY(0deg)");
//   //   setCanAnimate(false);
//   //   setIsHovered(false);
//   // };

//   // useEffect(() => {
//   //   return () => {
//   //     if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
//   //   };
//   // }, []);

//   if (!isAuthenticated) {
//     return null; // Don't show header if not authenticated
//   }
//   // Dummy data (replace with real data from backend)
//   const friendCount = friendsCounts;
//   const profilePic = user.profilePic || "/user.jpg"; // Dummy profile image
//   return (
//     <header className="w-full bg-[var(--background)] text-[var(--foreground) shadow-md py-4 px-6 flex justify-between items-center">
//       <div
//         // ref={headerRef}
//         className={`relative w-[80%] m-auto h-20 rounded-4xl flex items-center justify-around bg-[var(--card)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow`}

//         // className={`relative w-[80%] m-auto h-20 rounded-4xl flex items-center justify-around
//         //   transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
//         //   ${isHovered ? "glow" : ""}
//         // `}
//         // style={{
//         //   transform,
//         //   transformStyle: "preserve-3d",
//         //   perspective: "1000px",
//         //   background:
//         //     "linear-gradient(135deg, rgb(8 22 53), rgb(2 8 32)), radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1), transparent 40%)",
//         //   backgroundBlendMode: "overlay",
//         // }}
//         // onMouseMove={handleMouseMove}
//         // onMouseEnter={handleMouseEnter}
//         // onMouseLeave={handleMouseLeave}
//       >
//         <div className="absolute inset-0 pointer-events-none shimmer-mask rounded-4xl z-0" />

//         {/* Left Section */}
//         <div className="flex items-center space-x-6">
//           {/* Profile Picture */}
//           <Link href="/pages/profilePage">
//             <img
//               src={profilePic}
//               alt="Profile"
//               className="w-10 h-10 rounded-full cursor-pointer border-2 border-[var(--accent)] hover:opacity-80"
//             />
//           </Link>

//           <div
//             onClick={() => {
//               setFindFriend(false);
//               setFriendsRequests(false);
//               setAllFriends(false);
//               setGroupChatOpen(false);
//               setFindFriendWithChat(true);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//           >
//             <div className="text-2xl font-bold cursor-pointer text-[var(--accent)] transition flex items-center space-x-2">
//               {/* Gappo */}
//               Chugli
//             </div>
//           </div>
//         </div>

//         {/* Center Section - Gappo Logo */}
//         <div className="w-1/2 flex justify-around">
//           {/* Home */}
//           <div
//             onClick={() => {
//               setFindFriend(false);
//               setFriendsRequests(false);
//               setAllFriends(false);
//               setGroupChatOpen(false);
//               setFindFriendWithChat(true);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//             className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
//           >
//             <FaHome size={24} />
//             <span>Home</span>
//           </div>
//           {/* find Friend */}
//           <div
//             onClick={() => {
//               setFindFriend(true);
//               setFriendsRequests(false);
//               setAllFriends(false);
//               setGroupChatOpen(false);
//               setFindFriendWithChat(false);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//             className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
//           >
//             <FaSearch size={24} />
//             <span>Find Friends</span>
//           </div>
//           {/* Friend Requests */}
//           <div
//             onClick={() => {
//               setFindFriend(false);
//               setFriendsRequests(true);
//               setAllFriends(false);
//               setGroupChatOpen(false);
//               setFindFriendWithChat(false);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//             className="flex relative cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
//           >
//             <FaBell size={24} />
//             <span>Requests</span>
//             <div className="absolute top-[-10px] left-8">
//               <NotificationBell />
//             </div>
//           </div>

//           {/* Friends Count */}
//           <div
//             onClick={() => {
//               setFindFriend(false);
//               setFriendsRequests(false);
//               setAllFriends(true);
//               setGroupChatOpen(false);
//               setFindFriendWithChat(false);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//             className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
//           >
//             <FaUserFriends size={24} />
//             <span>{friendCount} Friends</span>
//           </div>

//           {/* Groups */}
//           <div
//             onClick={() => {
//               setFindFriend(false);
//               setFriendsRequests(false);
//               setAllFriends(false);
//               setGroupChatOpen(true);
//               setFindFriendWithChat(false);
//               setMessages([]);
//               setLoadingMessages(true);
//               setSelectedFriend(null);
//               router.push("/");
//             }}
//             className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
//           >
//             <FaUsers size={24} />
//             <span>Groups</span>
//           </div>
//         </div>

//         {/* Right Section */}
//         <div className="flex items-center space-x-4">
//           {/* Settings */}
//           <Link href="/pages/settings" className="hover:text-[var(--accent)]">
//             <FaCog className="hover:rotate-90 transition duration-200" size={24} />
//           </Link>

//           {/* Logout Button */}
//           <button
//             onClick={logout}
//             className="flex items-center cursor-pointer space-x-2 bg-red-500 border-2 border-black hover:border-red-800 text-[var(--foreground)] px-3 py-2 rounded-lg hover:bg-red-400"
//           >
//             <MdLogout size={20} />
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  userAtom,
} from "../states/States";
import NotificationBell from "./NotificationBell";

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
  const router = useRouter();
  const [, setShowLeft] = useAtom(responsiveDeviceAtom);

  const [menuOpen, setMenuOpen] = useState(false);

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
    router.push("/");
  };

  return (
    <header className="w-full bg-[var(--background)] text-[var(--foreground)] shadow-md py-4 px-6">
      {/* Desktop Header */}
      <div className="hidden lg:flex w-[90%] px-4 gap-2 m-auto h-20 rounded-4xl items-center justify-around bg-[var(--card)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow">
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          <Link href="/pages/profilePage">
            <img
              src={profilePic}
              alt="Profile"
              className="w-10 h-10 flex flex-nowrap rounded-full cursor-pointer border-2 border-[var(--accent)] hover:opacity-80"
            />
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
            className="text-2xl font-bold cursor-pointer text-[var(--accent)] flex items-center space-x-2"
          >
            Chugli
          </div>
        </div>

        {/* Center Section */}
        <div className="w-[60%] flex justify-around gap-2">
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
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaHome size={24} />
            <span className="hidden lg:flex md:text-sm">Home</span>
          </div>

          <div
            onClick={() =>
              handleNav(() => {
                setFindFriend(true);
                setFindFriendWithChat(false);
                setFriendsRequests(false);
                setAllFriends(false);
                setGroupChatOpen(false);
              })
            }
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaSearch size={24} />
            <span className="hidden lg:flex md:text-sm">Find Friends</span>
          </div>

          <div
            onClick={() =>
              handleNav(() => {
                setFindFriend(false);
                setFindFriendWithChat(false);
                setFriendsRequests(true);
                setAllFriends(false);
                setGroupChatOpen(false);
              })
            }
            className="flex relative cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaBell size={24} />
            <span className="hidden lg:flex md:text-sm">Requests</span>
            <div className="absolute top-[-10px] left-8">
              <NotificationBell />
            </div>
          </div>

          <div
            onClick={() =>
              handleNav(() => {
                setAllFriends(true);
                setFindFriend(false);
                setFindFriendWithChat(false);
                setFriendsRequests(false);
                setGroupChatOpen(false);
              })
            }
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaUserFriends size={24} />
            <span className="hidden lg:flex md:text-sm">
              {friendCount} Friends
            </span>
          </div>

          <div
            onClick={() =>
              handleNav(() => {
                setGroupChatOpen(true);
                setFindFriend(false);
                setFindFriendWithChat(false);
                setFriendsRequests(false);
                setAllFriends(false);
              })
            }
            className="flex cursor-pointer items-center space-x-2 hover:text-[var(--accent)]"
          >
            <FaUsers size={24} />
            <span className="hidden lg:flex md:text-sm">Groups</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 space-x-4">
          <Link href="/pages/settings" className="hover:text-[var(--accent)]">
            <FaCog
              className="hover:rotate-90 transition duration-200"
              aria-label="Setting"
              size={24}
            />
          </Link>
          <button
            onClick={logout}
            className="flex items-center cursor-pointer space-x-2 bg-red-500 border-2 border-black hover:border-red-800 text-[var(--foreground)] px-3 py-2 rounded-lg hover:bg-red-400"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between rounded-4xl px-4 py-4 bg-[var(--card)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] glow">
        <div className="flex items-center space-x-3">
          <Link href="/pages/profilePage">
            <img
              src={profilePic}
              alt="Profile"
              className="w-9 h-9 rounded-full border-2 border-[var(--accent)]"
            />
          </Link>
          <span
            className="text-xl font-bold text-[var(--accent)]"
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

        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="lg:hidden absolute z-1000 w-[87%] m-auto flex flex-col bg-[var(--card)] rounded-xl mt-2 py-3 px-4 space-y-3 shadow-lg overflow-hidden"
          >
            <button
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
              className="flex items-center space-x-2"
            >
              <FaHome />
              <span>Home</span>
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
                  router.push("/");
                })
              }
              className="flex items-center space-x-2"
            >
              <FaSearch />
              <span>Find Friends</span>
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
                  router.push("/");
                })
              }
              className="flex items-center space-x-2 relative"
            >
              <FaBell />
              <span>Requests</span>
              <div className="absolute right-4">
                <NotificationBell />
              </div>
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
                  router.push("/");
                })
              }
              className="flex items-center space-x-2"
            >
              <FaUserFriends />
              <span>{friendCount} Friends</span>
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
                  router.push("/");
                })
              }
              className="flex items-center space-x-2"
            >
              <FaUsers />
              <span>Groups</span>
            </button>

            <Link
              href="/pages/settings"
              onClick={() => {
                setMenuOpen(false);
                setShowLeft(true);
              }}
              className="flex items-center space-x-2"
            >
              <FaCog />
              <span>Settings</span>
            </Link>

            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
                setShowLeft(true);
              }}
              className="flex items-center space-x-2 text-red-500"
            >
              <MdLogout />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
