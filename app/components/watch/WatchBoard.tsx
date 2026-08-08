"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TogetherRoom, WatchRoomState } from "../../states/togetherTypes";
import {
  Play,
  Pause,
  Film,
  Crown,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Upload,
  Link,
  Sparkles,
  Check,
  X,
  Radio,
  Sliders,
  Tv,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

interface WatchBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

const PRESET_VIDEOS = [
  {
    title: "Big Buck Bunny (Open Movie)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    desc: "Classic open-source animated short movie.",
  },
  {
    title: "Sintel (Open Movie)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    desc: "High quality open-source fantasy short film.",
  },
  {
    title: "Tears of Steel (Open Movie)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    desc: "Sci-fi open movie set in Amsterdam.",
  },
  {
    title: "Elephant's Dream (Open Movie)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    desc: "The world's first open-source 3D movie.",
  },
];

function getMediaUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/uploads")) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
      console.log("envUrl", `${envUrl.replace(/\/+$/, "")}${url}`);
      return `${envUrl.replace(/\/+$/, "")}${url}`;
    }
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "localhost";
      return `http://${hostname}:5000${url}`;
    }
    return `http://localhost:5000${url}`;
  }
  return url;
}

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const WatchBoard: React.FC<WatchBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const watchState = room.state.watch as WatchRoomState | undefined;
  const isHost = room.hostId === currentUserId;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const comments = watchState?.comments || [];

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSendComment = (textToSend?: string) => {
    const text = textToSend || commentText;
    if (!text.trim()) return;

    onEmit("together:watch:updateState", {
      roomId: room.roomId,
      action: "addComment",
      text: text.trim(),
      username: currentUserId === room.hostId ? "Host" : "Partner",
    });

    if (!textToSend) setCommentText("");
  };

  const youtubeId = getYouTubeId(watchState?.mediaUrl || null);

  // Sync Video / YouTube Element with Backend Watch State
  useEffect(() => {
    if (!watchState) return;

    // Handle YouTube iframe PostMessage command for play/pause sync
    if (youtubeId && iframeRef.current && iframeRef.current.contentWindow) {
      const cmd = watchState.playing ? "playVideo" : "pauseVideo";
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: cmd, args: "" }),
          "*"
        );
      } catch (err) {
        // Safe cross-origin catch
      }
      return;
    }

    // Handle Standard HTML5 Video element
    if (videoRef.current) {
      const v = videoRef.current;
      if (v.readyState < 1) return; // Wait until video metadata is loaded

      const elapsed = watchState.playing
        ? (Date.now() - watchState.updatedAt) / 1000
        : 0;
      const targetTime = Math.max(0, watchState.position + elapsed);

      // Drift Correction Check (> 1.5s drift triggers seek)
      if (Math.abs(v.currentTime - targetTime) > 1.5 && (v.duration ? targetTime < v.duration : true)) {
        v.currentTime = targetTime;
        setIsSyncing(true);
        setSyncNotice("Adjusting Sync...");
        setTimeout(() => {
          setIsSyncing(false);
          setSyncNotice(null);
        }, 1000);
      }

      // Play/Pause State Enforcement
      if (watchState.playing && v.paused) {
        v.play().catch(() => {
          // If browser blocks unmuted play, fallback to muted play
          v.muted = true;
          setIsMuted(true);
          v.play().catch(() => { });
        });
      } else if (!watchState.playing && !v.paused) {
        v.pause();
      }
    }
  }, [watchState?.playing, watchState?.position, watchState?.updatedAt, watchState?.mediaUrl, youtubeId]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && watchState) {
      const v = videoRef.current;
      setDuration(v.duration);

      const elapsed = watchState.playing
        ? (Date.now() - watchState.updatedAt) / 1000
        : 0;
      const targetTime = Math.max(0, watchState.position + elapsed);
      if (v.duration && targetTime < v.duration) {
        v.currentTime = targetTime;
      }

      if (watchState.playing && v.paused) {
        v.play().catch(() => {
          v.muted = true;
          setIsMuted(true);
          v.play().catch(() => { });
        });
      }
    }
  };

  const handlePlayToggle = () => {
    if (!watchState) return;
    const newPlayingState = !watchState.playing;
    const currentPos = videoRef.current ? videoRef.current.currentTime : watchState.position;

    onEmit("together:watch:updateState", {
      roomId: room.roomId,
      action: newPlayingState ? "play" : "pause",
      position: currentPos,
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }

    onEmit("together:watch:updateState", {
      roomId: room.roomId,
      action: "seek",
      position: newTime,
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSelectPresetVideo = (presetUrl: string, presetTitle: string) => {
    onEmit("together:watch:updateState", {
      roomId: room.roomId,
      action: "changeMedia",
      mediaUrl: presetUrl,
      mediaTitle: presetTitle,
    });
    setShowMediaModal(false);
  };

  const handleCustomUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = customUrlInput.trim();
    if (!input) return;

    setShowMediaModal(false);

    let finalUrl = input;
    const ytId = getYouTubeId(input);
    const title = ytId ? "YouTube Video" : (input.split("/").pop() || "Custom Video");

    if (!ytId) {
      setIsUploading(true);
      setSyncNotice("Uploading Video to Cloud...");
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${apiUrl}/api/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: input,
            roomId: room.roomId,
            title,
          }),
        });
        const data = await res.json();
        if (data.url) {
          finalUrl = data.url;
        }
      } catch (err) {
        console.warn("Cloudinary URL upload failed, using direct link:", err);
      } finally {
        setIsUploading(false);
        setTimeout(() => setSyncNotice(null), 3000);
      }
    }

    onEmit("together:watch:updateState", {
      roomId: room.roomId,
      action: "changeMedia",
      mediaUrl: finalUrl,
      mediaTitle: title,
    });

    setCustomUrlInput("");
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSyncNotice("Uploading Video to Partner...");
    setShowMediaModal(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", room.roomId);

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onEmit("together:watch:updateState", {
          roomId: room.roomId,
          action: "changeMedia",
          mediaUrl: data.url,
          mediaTitle: file.name,
        });
        setSyncNotice("Video uploaded & ready for both!");
      }
    } catch (err) {
      console.error("Failed to upload video file:", err);
      setSyncNotice("Video upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Video Header & Status Bar */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
            <Film size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[var(--foreground)] truncate flex items-center gap-2">
              <span>{watchState?.mediaTitle || "Select a Video"}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                <Radio size={12} className="animate-pulse" />
                {watchState?.playing ? "Playing Synced" : "Paused"}
              </span>
              {syncNotice && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 animate-pulse">
                  {syncNotice}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow transition cursor-pointer"
          >
            {watchState?.playing ? <Pause size={14} /> : <Play size={14} />}
            <span>{watchState?.playing ? "Pause Sync" : "Play Sync"}</span>
          </button>
          <button
            onClick={() => setShowMediaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-bold shadow hover:opacity-90 transition cursor-pointer"
          >
            <Tv size={14} />
            <span>Change Video</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] group">
        {/* Cloudinary Upload Loader Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                <Loader2 size={30} className="absolute text-red-400 animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1 max-w-sm">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Upload size={16} className="text-red-400 animate-bounce" />
                  Uploading Video to Cloud...
                </h4>
                <p className="text-xs text-white/70">
                  Saving video to Cloudinary. It will automatically play for both of you once ready!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {youtubeId ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${watchState?.playing ? 1 : 0}&start=${Math.floor(watchState?.position || 0)}&enablejsapi=1`}
            title={watchState?.mediaTitle || "YouTube Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : watchState?.mediaUrl ? (
          <video
            ref={videoRef}
            src={getMediaUrl(watchState.mediaUrl) || watchState.mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              const err = e.currentTarget.error;
              const code = err ? err.code : "unknown";
              console.warn(`Video playback notice (code ${code}):`, getMediaUrl(watchState.mediaUrl));
              setSyncNotice("Error playing video file. Format or codec may be unsupported.");
            }}
            preload="auto"
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-white/70">
            <Tv size={48} className="text-red-500 animate-bounce" />
            <h4 className="text-sm font-bold">No Video Selected</h4>
            <p className="text-xs text-white/50 max-w-xs">
              Select an open sample video, enter a YouTube link, or upload a local file to start watching together!
            </p>
            <button
              onClick={() => setShowMediaModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold shadow-lg hover:bg-red-600 transition cursor-pointer"
            >
              Choose Video Now 🎬
            </button>
          </div>
        )}

        {/* Central Play Overlay when Paused (Native HTML5 Video) */}
        {!youtubeId && watchState?.mediaUrl && !watchState?.playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] pointer-events-auto">
            <button
              onClick={handlePlayToggle}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition cursor-pointer"
              title="Click to Play Synced Video"
            >
              <Play size={36} className="ml-1" />
            </button>
          </div>
        )}

        {/* Custom Video Control Overlay (For Native HTML5 Videos Only to avoid Duplicate Timelines) */}
        {!youtubeId && watchState?.mediaUrl && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex flex-col gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Seek Bar */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-white/80 font-bold min-w-[36px]">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="text-[11px] font-mono text-white/80 font-bold min-w-[36px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {/* Play / Pause Toggle */}
                <button
                  onClick={handlePlayToggle}
                  className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition cursor-pointer"
                >
                  {watchState.playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 text-white">
                  <button onClick={toggleMute} className="hover:text-red-400 transition cursor-pointer">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-white">
                {isHost && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Crown size={10} /> Host Control
                  </span>
                )}
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 hover:text-red-400 transition cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Live Comments & Quick Reactions ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <MessageSquare size={15} /> Live Watch Comments ({comments.length})
          </h4>
          <span className="text-[10px] text-[var(--foreground)] opacity-50 font-semibold">
            Real-time synchronized
          </span>
        </div>

        {/* Quick Reaction Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["🍿 Movie Time!", "🔥 Wow", "😂 Haha", "❤️ Love it", "😱 Omg", "👏 Bravo"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendComment(emoji)}
              className="px-2.5 py-1 rounded-xl bg-[var(--muted)] hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500/30 text-xs font-bold text-[var(--foreground)] transition cursor-pointer flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Comments Stream List */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-[var(--foreground)] opacity-50 italic py-2 text-center">
              No live comments yet. React or send a comment while watching!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="flex flex-col p-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs gap-0.5"
              >
                <div className="flex items-center justify-between text-[10px] opacity-70">
                  <span className="font-bold text-red-400">{c.username}</span>
                  <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs font-medium text-[var(--foreground)]">{c.text}</p>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Live Comment Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendComment();
          }}
          className="flex items-center gap-2 pt-1 border-t border-[var(--border)]"
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a live comment..."
            className="flex-1 p-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-red-500 transition"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Media Selection Modal */}
      <AnimatePresence>
        {showMediaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowMediaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Film size={18} className="text-red-500" />
                  Select Video Source
                </h3>
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preset Open Movies */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Open Sample Movies (Free & Legal)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_VIDEOS.map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => handleSelectPresetVideo(preset.url, preset.title)}
                      className="flex flex-col text-left p-3 rounded-xl bg-[var(--muted)] hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500/40 transition cursor-pointer gap-1 group"
                    >
                      <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-red-400 transition-colors">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-[var(--foreground)] opacity-60">
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct URL Input */}
              <form onSubmit={handleCustomUrlSubmit} className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Link size={14} /> Direct Video URL or YouTube Link
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Load
                  </button>
                </div>
              </form>

              {/* Local File Upload */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Upload size={14} /> Local Video File Upload
                </span>
                <label className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-red-500/40 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 transition cursor-pointer text-center ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload size={16} className={isUploading ? "animate-spin" : ""} />
                  {isUploading ? "Uploading Video to Partner..." : "Choose Local Video File"}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
