"use client";
import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  X,
} from "lucide-react";
import Image from "next/image";

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: string[];
  initialIndex?: number;
  username?: string;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  username = "user",
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const mediaRef = useRef<HTMLDivElement>(null);
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = media[currentIndex];
    const ext = media[currentIndex].endsWith(".mp4")
      ? ".mp4"
      : media[currentIndex].endsWith(".webm")
      ? ".webm"
      : ".jpg";
    const timeStamp = new Date().toISOString().split("T")[0];
    link.download = `Chat-${username}-${timeStamp}${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideo =
    media[currentIndex]?.includes("video") ||
    media[currentIndex]?.endsWith(".mp4");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-[10%] bg-opacity-80"
    >
      <button
        onClick={onClose}
        className="absolute cursor-pointer top-3 right-3 bg-red-500 p-2  text-white hover:text-gray-300"
      >
        <X size={24} />
      </button>
      <DialogPanel className="relative max-w-3xl w-full max-h-[90vh] p-4 rounded-lg bg-black">
        {media?.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 p-2 -translate-y-1/2 text-[var(--accent)] cursor-pointer hover:text-gray-300 rounded-full bg-neutral-600 z-50"
            >
              <ChevronLeft size={30} />
            </button>
            <button
              onClick={handleNext}
              className="absolute cursor-pointer right-4 top-1/2 p-2 -translate-y-1/2 text-[var(--accent)] hover:text-gray-300 rounded-full bg-neutral-600 z-50"
            >
              <ChevronRight size={30} />
            </button>
          </>
        )}

        <div
          ref={mediaRef}
          className="flex flex-col items-center justify-center space-y-4"
        >
          {isVideo ? (
            <video
              src={media[currentIndex]}
              controls
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          ) : (
            <Image
              src={media[currentIndex]}
              alt="media"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else if (mediaRef.current) {
                  mediaRef.current.requestFullscreen();
                }
              }}
              className="text-white cursor-pointer bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1"
            >
              <Maximize2 size={16} /> Fullscreen
            </button>
            <button
              onClick={handleDownload}
              className="text-white cursor-pointer bg-green-600 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1"
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

export default MediaViewerModal;
