"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TogetherRoom, MusicRoomState, MusicTrack } from "../../states/togetherTypes";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Disc,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ListMusic,
  Radio,
  Sparkles,
  Link,
  Upload,
  X,
  User,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

interface ListenBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

const PRESET_AUDIO_TRACKS = [
  {
    title: "Lofi Chill Beats",
    artist: "Open Audio Archive",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    title: "Acoustic Sunset",
    artist: "SoundHelix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "Synthwave Breeze",
    artist: "SoundHelix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    title: "Ambient Evening",
    artist: "SoundHelix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
];

function getMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/uploads")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiUrl}${url}`;
  }
  return url;
}

export const ListenBoard: React.FC<ListenBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicState = room.state.music as MusicRoomState | undefined;

  const currentTrackIndex = musicState?.currentTrackIndex ?? 0;
  const queue = musicState?.queue || [];
  const currentTrack = queue[currentTrackIndex] as MusicTrack | undefined;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Track
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const comments = musicState?.comments || [];

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSendComment = (textToSend?: string) => {
    const text = textToSend || commentText;
    if (!text.trim()) return;

    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "addComment",
      text: text.trim(),
      username: currentUserId === room.hostId ? "Host" : "Partner",
    });

    if (!textToSend) setCommentText("");
  };

  // Sync Audio Element with Backend Music State
  useEffect(() => {
    if (!musicState || !audioRef.current) return;

    const a = audioRef.current;
    const elapsed = musicState.playing
      ? (Date.now() - musicState.updatedAt) / 1000
      : 0;
    const targetTime = Math.max(0, musicState.position + elapsed);

    // Drift Check (> 1.5s triggers seek sync)
    if (Math.abs(a.currentTime - targetTime) > 1.5) {
      a.currentTime = targetTime;
    }

    // Play/Pause State Enforcement
    if (musicState.playing && a.paused) {
      a.play().catch(() => { });
    } else if (!musicState.playing && !a.paused) {
      a.pause();
    }
  }, [
    musicState?.playing,
    musicState?.position,
    musicState?.updatedAt,
    musicState?.currentTrackIndex,
    currentTrack?.url,
  ]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    // Auto-advance to next track in queue when ended
    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "nextTrack",
    });
  };

  const handlePlayToggle = () => {
    if (!audioRef.current || !musicState) return;
    const newPlayingState = !musicState.playing;

    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: newPlayingState ? "play" : "pause",
      position: audioRef.current.currentTime,
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }

    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "seek",
      position: newTime,
    });
  };

  const handleNextTrack = () => {
    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "nextTrack",
    });
  };

  const handlePrevTrack = () => {
    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "prevTrack",
    });
  };

  const handleSelectTrack = (index: number) => {
    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "selectTrack",
      trackIndex: index,
    });
  };

  const handleRemoveTrack = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "removeTrack",
      trackIndex: index,
    });
  };

  const handleAddPresetTrack = (presetUrl: string, title: string, artist: string) => {
    const newTrack: MusicTrack = {
      id: `track-${Date.now()}`,
      title,
      artist,
      url: presetUrl,
      addedBy: currentUserId,
    };

    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "addTrack",
      track: newTrack,
    });
    setShowAddModal(false);
  };

  const handleAddCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputUrl = customUrl.trim();
    if (!inputUrl) return;

    setIsUploading(true);
    setShowAddModal(false);

    let finalUrl = inputUrl;
    const title = customTitle.trim() || inputUrl.split("/").pop() || "Audio Track";
    const artist = customArtist.trim() || "Web Audio";

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: inputUrl,
          roomId: room.roomId,
          title,
        }),
      });

      const data = await res.json();
      if (data.url) {
        finalUrl = data.url;
      }
    } catch (err) {
      console.warn("Failed to upload song URL to Cloudinary, using raw link:", err);
    } finally {
      setIsUploading(false);
    }

    const newTrack: MusicTrack = {
      id: `track-${Date.now()}`,
      title,
      artist,
      url: finalUrl,
      addedBy: currentUserId,
    };

    onEmit("together:music:updateState", {
      roomId: room.roomId,
      action: "addTrack",
      track: newTrack,
    });

    setCustomTitle("");
    setCustomArtist("");
    setCustomUrl("");
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", room.roomId);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        const newTrack: MusicTrack = {
          id: `track-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Uploaded Track",
          url: data.url,
          addedBy: currentUserId,
        };

        onEmit("together:music:updateState", {
          roomId: room.roomId,
          action: "addTrack",
          track: newTrack,
        });

        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to upload audio file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Hidden HTML5 Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={getMediaUrl(currentTrack.url)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Main Music Player Card */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col items-center gap-5 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500" />

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
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <Loader2 size={30} className="absolute text-cyan-400 animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1 max-w-sm">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Upload size={16} className="text-cyan-400 animate-bounce" />
                  Uploading Song to Cloud...
                </h4>
                <p className="text-xs text-white/70">
                  Saving track to Cloudinary. It will be added to the queue & played for both of you automatically!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Status Badge */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Radio size={13} className="animate-pulse" />
            <span>{musicState?.playing ? "Synced Audio Playing" : "Paused"}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow hover:opacity-90 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Track</span>
          </button>
        </div>

        {/* Rotating Vinyl Record Artwork */}
        <div className="relative my-2">
          <motion.div
            animate={{ rotate: musicState?.playing ? 360 : 0 }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "linear",
            }}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border-4 border-slate-700 shadow-2xl flex items-center justify-center relative"
          >
            {/* Vinyl Groves */}
            <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-slate-700/50 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-slate-700/50 flex items-center justify-center">
                {/* Vinyl Center Badge */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  <Disc size={20} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vinyl Needle Indicator */}
          <div
            className={`absolute -top-1 -right-2 w-12 h-14 transition-transform duration-500 origin-top-right ${musicState?.playing ? "rotate-12" : "-rotate-12 opacity-60"
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow ml-auto" />
            <div className="w-0.5 h-10 bg-cyan-300/80 mx-auto" />
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="text-center min-w-0 max-w-full px-4">
          <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] truncate">
            {currentTrack?.title || "No Track Playing"}
          </h3>
          <p className="text-xs text-[var(--foreground)] opacity-60 truncate font-semibold mt-0.5">
            {currentTrack?.artist || "Select or add a track to the queue"}
          </p>
        </div>

        {/* Progress Seek Bar */}
        <div className="w-full flex flex-col gap-1.5 max-w-md">
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono text-[var(--foreground)] opacity-70 font-bold min-w-[36px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[11px] font-mono text-[var(--foreground)] opacity-70 font-bold min-w-[36px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Playback Controls & Volume */}
        <div className="flex items-center justify-between w-full max-w-md pt-2">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
            <button onClick={toggleMute} className="hover:text-cyan-400 transition cursor-pointer">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Prev / Play / Next Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevTrack}
              className="p-2 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition cursor-pointer"
              title="Previous Track"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={handlePlayToggle}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
            >
              {musicState?.playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>

            <button
              onClick={handleNextTrack}
              className="p-2 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition cursor-pointer"
              title="Next Track"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Queue Count */}
          <div className="flex items-center gap-1 text-xs text-[var(--foreground)] opacity-60 font-bold">
            <ListMusic size={16} />
            <span>{queue.length}</span>
          </div>
        </div>
      </div>

      {/* Playlist Queue Section */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <ListMusic size={15} /> Shared Audio Queue ({queue.length})
          </h4>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-[var(--foreground)] opacity-50 italic py-2 text-center">
            Queue is empty. Click "Add Track" to choose music!
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {queue.map((tr, idx) => {
              const isCurrent = idx === currentTrackIndex;
              return (
                <div
                  key={tr.id || idx}
                  onClick={() => handleSelectTrack(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${isCurrent
                      ? "bg-cyan-500/15 border-cyan-500/50 text-[var(--foreground)] shadow-sm"
                      : "bg-[var(--muted)] border-[var(--border)] opacity-80 hover:opacity-100"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${isCurrent ? "bg-cyan-500 text-white" : "bg-[var(--card)] text-[var(--foreground)]"
                        }`}
                    >
                      {isCurrent ? <Disc size={14} className="animate-spin" /> : idx + 1}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold truncate">{tr.title}</p>
                      <p className="text-[10px] opacity-60 truncate">{tr.artist}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveTrack(idx, e)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer flex-shrink-0"
                    title="Remove Track"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Live Music Comments & Quick Reactions ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <MessageSquare size={15} /> Live Music Chat ({comments.length})
          </h4>
          <span className="text-[10px] text-[var(--foreground)] opacity-50 font-semibold">
            Real-time synchronized
          </span>
        </div>

        {/* Quick Reaction Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["🎵 Jamming!", "🔥 Fire Track", "❤️ Love this song", "💃 Dancing", "🎧 Vibe", "✨ Perfect"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendComment(emoji)}
              className="px-2.5 py-1 rounded-xl bg-[var(--muted)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/30 text-xs font-bold text-[var(--foreground)] transition cursor-pointer flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Comments Stream List */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-[var(--foreground)] opacity-50 italic py-2 text-center">
              No live comments yet. React or send a comment while listening!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="flex flex-col p-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs gap-0.5"
              >
                <div className="flex items-center justify-between text-[10px] opacity-70">
                  <span className="font-bold text-cyan-400">{c.username}</span>
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
            className="flex-1 p-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white transition cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Add Track Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
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
                  <Music size={18} className="text-cyan-400" />
                  Add Audio to Queue
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preset Open Audio */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Preset Open Audio Tracks (Free)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_AUDIO_TRACKS.map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => handleAddPresetTrack(preset.url, preset.title, preset.artist)}
                      className="flex flex-col text-left p-3 rounded-xl bg-[var(--muted)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/40 transition cursor-pointer gap-1 group"
                    >
                      <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-cyan-400 transition-colors">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-[var(--foreground)] opacity-60">
                        {preset.artist}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Audio URL */}
              <form onSubmit={handleAddCustomUrl} className="flex flex-col gap-2.5 pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Link size={14} /> Direct Audio URL (.mp3 / .wav)
                </span>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Track Title (optional)"
                  className="w-full p-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-cyan-500 transition"
                />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3"
                  className="w-full p-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-cyan-500 transition"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  Add Track to Queue
                </button>
              </form>

              {/* Local Audio Upload */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Upload size={14} /> Local Audio File Upload
                </span>
                <label className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 text-xs font-bold text-cyan-400 transition cursor-pointer text-center ${isUploading ? "opacity-60 pointer-events-none" : "hover:border-cyan-500 hover:bg-cyan-500/10"}`}>
                  <Upload size={16} className={isUploading ? "animate-spin" : ""} />
                  {isUploading ? "Uploading Audio to Cloud..." : "Choose Local MP3 / Audio File"}
                  <input
                    type="file"
                    accept="audio/*"
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
