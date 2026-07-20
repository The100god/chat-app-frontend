// "use client"
// import { useState, useRef, ReactNode } from "react";

// interface ResizableLayoutProps {
//   leftComponent: ReactNode;
//   rightComponent: ReactNode;
// }

// const ResizableLayout: React.FC<ResizableLayoutProps> = ({ leftComponent, rightComponent }) => {
//   const [leftWidth, setLeftWidth] = useState<number>(window.innerWidth * 0.4);
//   const isDraggingRef = useRef<boolean>(false);

//   const handleMouseDown = (e: React.MouseEvent) => {
//     isDraggingRef.current = true;
//     document.body.style.userSelect = "none";

//     const onMouseMove = (moveEvent: MouseEvent) => {
//       if (isDraggingRef.current) {
//         const newWidth = Math.max(250, Math.min(moveEvent.clientX, window.innerWidth - 300));
//         setLeftWidth(newWidth);
//       }
//     };

//     const onMouseUp = () => {
//       isDraggingRef.current = false;
//       document.removeEventListener("mousemove", onMouseMove);
//       document.removeEventListener("mouseup", onMouseUp);
//       document.body.style.userSelect = "auto";
//     };

//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("mouseup", onMouseUp);
//   };

//   return (
//     <div className="flex h-full w-full overflow-hidden">
//       {/* Left Section */}
//       <div
//         className="flex-shrink-0 bg-black p-2"
//         style={{ width: `${leftWidth}px`, minWidth: "250px", maxWidth: "75vw" }}
//       >
//         {leftComponent}
//       </div>

//       {/* Resizable Divider */}
//       <div
//         className="cursor-col-resize bg-[var(--accent)]/35 w-[6px] hover:bg-[var(--accent)] transition"
//         onMouseDown={handleMouseDown}
//       />

//       {/* Right Section */}
//       <div className="flex-grow bg-black p-2">{rightComponent}</div>
//     </div>
//   );
// };

// export default ResizableLayout;

"use client";
import { useAtom } from "jotai";
import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import {
  responsiveDeviceAtom,
  selectedFriendAtom,
  selectedGroupAtom,
} from "../states/States";
import { ArrowLeft } from "lucide-react";

interface ResizableLayoutProps {
  leftComponent: ReactNode;
  rightComponent: ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftComponent,
  rightComponent,
}) => {
  const [leftWidth, setLeftWidth] = useState<number>(350);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showLeft, setShowLeft] = useAtom(responsiveDeviceAtom); // for mobile toggle
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [, setSelectedGroup] = useAtom(selectedGroupAtom);
  const isDraggingRef = useRef<boolean>(false);
  const isPushingStateRef = useRef<boolean>(false);

  // 🧠 Detect initial dimensions and screen resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLeftWidth(window.innerWidth * 0.4);
      setIsMobile(window.innerWidth < 1025);
    }
    const handleResize = () => setIsMobile(window.innerWidth < 1025);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to handle going back to home section
  const handleBackToHome = useCallback(() => {
    setShowLeft(true);
    setSelectedFriend(null);
    setSelectedGroup(null);
  }, [setShowLeft, setSelectedFriend, setSelectedGroup]);

  // 📱 Push history state when chat area opens on mobile
  useEffect(() => {
    if (!isMobile) return;

    if (!showLeft) {
      if (
        typeof window !== "undefined" &&
        !window.history.state?.chatViewOpen &&
        !isPushingStateRef.current
      ) {
        isPushingStateRef.current = true;
        window.history.pushState({ chatViewOpen: true }, "");
        setTimeout(() => {
          isPushingStateRef.current = false;
        }, 100);
      }
    }
  }, [showLeft, isMobile]);

  // 📱 Handle mobile system back button (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      if (isMobile && !showLeft) {
        // When user presses mobile back button while viewing a chat, show Home (left section) instead of exiting
        handleBackToHome();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isMobile, showLeft, handleBackToHome]);

  const handleArrowBackClick = () => {
    handleBackToHome();
    if (typeof window !== "undefined" && window.history.state?.chatViewOpen) {
      window.history.back();
    }
  };

  // 🖱️ Resize handler (for desktop only)
  const handleMouseDown = () => {
    if (isMobile) return; // disable dragging on mobile
    isDraggingRef.current = true;
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        const newWidth = Math.max(
          250,
          Math.min(moveEvent.clientX, window.innerWidth - 300)
        );
        setLeftWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // 📱 Mobile Layout (toggle view)
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-transparent relative">
        {!showLeft && (
          <div className="absolute left-2 top-2 z-50">
            <button
              onClick={handleArrowBackClick}
              className="p-2.5 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/85 transition rounded-full flex items-center justify-center shadow-lg cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        )}

        <div className="flex-grow overflow-hidden bg-[var(--background)]">
          {showLeft ? leftComponent : rightComponent}
        </div>
      </div>
    );
  }

  // 💻 Desktop Layout
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Section */}
      <div
        className="flex-shrink-0 bg-[var(--background)] p-2"
        style={{ width: `${leftWidth}px`, minWidth: "250px", maxWidth: "75vw" }}
      >
        {leftComponent}
      </div>

      {/* Resizable Divider */}
      <div
        className="cursor-col-resize bg-[var(--accent)]/35 w-[6px] hover:bg-[var(--accent)] transition"
        onMouseDown={handleMouseDown}
      />

      {/* Right Section */}
      <div className="flex-grow bg-[var(--background)] p-2">{rightComponent}</div>
    </div>
  );
};

export default ResizableLayout;
