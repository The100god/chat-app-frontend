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
import { useState, useRef, useEffect, ReactNode } from "react";
import { responsiveDeviceAtom } from "../states/States";
import { ArrowLeft } from "lucide-react";

interface ResizableLayoutProps {
  leftComponent: ReactNode;
  rightComponent: ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftComponent,
  rightComponent,
}) => {
  const [leftWidth, setLeftWidth] = useState<number>(window.innerWidth * 0.4);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1025);
  const [showLeft, setShowLeft] = useAtom(responsiveDeviceAtom); // for mobile toggle
  const isDraggingRef = useRef<boolean>(false);

  // 🧠 Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1025);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
              onClick={() => setShowLeft(true)}
              className="p-2.5 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/85 transition rounded-full flex items-center justify-center shadow-lg cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        )}

        <div className="flex-grow overflow-hidden bg-black">
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
        className="flex-shrink-0 bg-black p-2"
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
      <div className="flex-grow bg-black p-2">{rightComponent}</div>
    </div>
  );
};

export default ResizableLayout;
