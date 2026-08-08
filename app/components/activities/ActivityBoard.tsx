// d:\Next.js\Chat\chat-app-frontend\app\components\activities\ActivityBoard.tsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TogetherRoom, TogetherActivityId } from "../../states/togetherTypes";
import {
  ACTIVITIES_REGISTRY,
  WOULD_YOU_RATHER_PROMPTS,
  TRUTH_PROMPTS,
  DARE_PROMPTS,
  THIS_OR_THAT_PROMPTS,
  DAILY_QUESTIONS,
  COUPLE_QUESTIONS_BY_CATEGORY,
} from "./activityRegistry";
import {
  Heart,
  Flame,
  Scale,
  Calendar,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  LogOut,
  ChevronRight,
  Users,
  Mic,
  Square,
  Volume2,
  Edit3,
  Dices,
  Trash2,
} from "lucide-react";

interface ActivityBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

export const ActivityBoard: React.FC<ActivityBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const [textInput, setTextInput] = useState("");
  const [todMode, setTodMode] = useState<"preset" | "text" | "voice">("preset");
  const [customTodText, setCustomTodText] = useState("");

  const [todAnswerMode, setTodAnswerMode] = useState<"text" | "voice">("text");
  const [todAnswerText, setTodAnswerText] = useState("");

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activityState = room.state.activity;
  const currentActivityId = activityState?.activityId || (room.activityId as TogetherActivityId) || "would_you_rather";

  const partnerId = room.participants.find((id) => id !== currentUserId) || "";
  const answers = activityState?.answers || {};
  const myAnswer = answers[currentUserId];
  const partnerAnswer = partnerId ? answers[partnerId] : null;
  const hasMyAnswer = myAnswer !== undefined && myAnswer !== null;
  const isRevealed = activityState?.status === "revealed";

  const currentPromptIndex = activityState?.currentPromptIndex || 0;
  const activeDefinition = ACTIVITIES_REGISTRY.find((a) => a.id === currentActivityId) || ACTIVITIES_REGISTRY[0];

  // Helper for Supported Audio Mime Types
  const getSupportedMimeType = () => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/ogg",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const rawMime = mediaRecorder.mimeType || mimeType || "audio/webm";
        const baseMime = rawMime.split(";")[0].trim() || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: baseMime });

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone permission or recording error:", err);
      alert("Microphone permission is required to record voice notes. Please allow mic access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioDataUrl(null);
    setRecordingSeconds(0);
  };

  const handleSelectAnswer = (ans: string | number) => {
    onEmit("together:activity:submitAnswer", {
      roomId: room.roomId,
      answer: ans,
    });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleSelectAnswer(textInput.trim());
    setTextInput("");
  };

  const handleNextPrompt = () => {
    setCustomTodText("");
    setTodAnswerText("");
    clearRecording();
    onEmit("together:activity:nextPrompt", { roomId: room.roomId });
  };

  const handleSelectTruthOrDare = (choice: "truth" | "dare") => {
    onEmit("together:activity:selectTruthOrDare", {
      roomId: room.roomId,
      choice,
    });
  };

  const handleConfirmTruthOrDareQuestion = () => {
    const choice = activityState?.truthOrDareChoice;
    if (!choice) return;

    let customText: string | null = null;
    let audioData: string | null = null;

    if (todMode === "preset") {
      const promptList = choice === "truth" ? TRUTH_PROMPTS : DARE_PROMPTS;
      customText = promptList[Math.floor(Math.random() * promptList.length)];
    } else if (todMode === "text") {
      if (!customTodText.trim()) return;
      customText = customTodText.trim();
    } else if (todMode === "voice") {
      if (!audioDataUrl) return;
      customText = "Listen to Voice Question 🎙️";
      audioData = audioDataUrl;
    }

    onEmit("together:activity:submitTruthOrDareQuestion", {
      roomId: room.roomId,
      customText,
      audioData,
    });

    setCustomTodText("");
    clearRecording();
  };

  const handleConfirmTruthOrDareAnswer = () => {
    let answerText: string | null = null;
    let audioData: string | null = null;

    if (todAnswerMode === "text") {
      if (!todAnswerText.trim()) return;
      answerText = todAnswerText.trim();
    } else if (todAnswerMode === "voice") {
      if (!audioDataUrl) return;
      answerText = "Voice Answer Recorded 🎙️";
      audioData = audioDataUrl;
    }

    onEmit("together:activity:submitTruthOrDareAnswer", {
      roomId: room.roomId,
      answerText,
      audioData,
    });

    setTodAnswerText("");
    clearRecording();
  };

  const handleSwitchCategory = (cat: string) => {
    onEmit("together:activity:switchCategory", {
      roomId: room.roomId,
      category: cat,
    });
  };

  const handleSwitchActivity = (newId: TogetherActivityId) => {
    onEmit("together:activity:switchActivity", {
      roomId: room.roomId,
      newActivityId: newId,
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-2xl mx-auto p-2">
      {/* ─── Top Header Bar ─── */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{activeDefinition.icon}</span>
          <div>
            <h2 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
              {activeDefinition.title}
            </h2>
            <p className="text-[11px] text-[var(--foreground)] opacity-60 font-medium">
              2-Player Real-Time Activity
            </p>
          </div>
        </div>

        {/* Activity Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={currentActivityId}
            onChange={(e) => handleSwitchActivity(e.target.value as TogetherActivityId)}
            className="py-1.5 px-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] cursor-pointer outline-none"
          >
            {ACTIVITIES_REGISTRY.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.title}
              </option>
            ))}
          </select>

          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
            title="Leave Activity Room"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ─── Activity Content Board ─── */}
      <AnimatePresence mode="wait">
        {/* 1. WOULD YOU RATHER */}
        {currentActivityId === "would_you_rather" && (() => {
          const promptObj = WOULD_YOU_RATHER_PROMPTS[currentPromptIndex % WOULD_YOU_RATHER_PROMPTS.length];
          const options = promptObj.options;

          return (
            <motion.div
              key={`wyr-${currentPromptIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-wider">
                  Scenario {currentPromptIndex + 1}
                </span>
                <span className="text-[10px] font-bold text-[var(--foreground)] opacity-60">
                  Would You Rather
                </span>
              </div>

              <h3 className="text-base font-black text-[var(--foreground)] text-center my-1">
                {promptObj.prompt}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, idx) => {
                  const isMyChoice = myAnswer === idx;
                  const isPartnerChoice = partnerAnswer === idx;

                  let cardStyle = "bg-[var(--muted)] border-[var(--border)] hover:border-pink-500/60";
                  if (hasMyAnswer && isMyChoice) {
                    cardStyle = "bg-pink-500/20 border-pink-500 text-pink-300 font-bold shadow-md";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasMyAnswer}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`p-4 rounded-2xl border text-xs font-semibold text-left transition flex flex-col justify-between gap-3 cursor-pointer ${cardStyle}`}
                    >
                      <span className="text-sm leading-relaxed">{opt}</span>

                      {/* Reveal badges */}
                      {isRevealed && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]/40">
                          {isMyChoice && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white">
                              You
                            </span>
                          )}
                          {isPartnerChoice && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white">
                              Partner
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Waiting Badge */}
              {hasMyAnswer && !isRevealed && (
                <div className="w-full py-2.5 px-4 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <Users size={14} /> Waiting for your partner's choice...
                </div>
              )}

              {/* Match Reveal Banner */}
              {isRevealed && (
                <div className="w-full flex flex-col items-center gap-3 pt-2">
                  <div
                    className={`w-full py-3 px-4 rounded-xl text-center font-black text-xs border flex items-center justify-center gap-2 ${
                      myAnswer === partnerAnswer
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    }`}
                  >
                    {myAnswer === partnerAnswer ? (
                      <>🎉 You both matched! You have the same choice!</>
                    ) : (
                      <>😄 Different choices! Opposites attract!</>
                    )}
                  </div>

                  <button
                    onClick={handleNextPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Next Scenario <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 2. TRUTH OR DARE */}
        {currentActivityId === "truth_or_dare" && (() => {
          const turnUserId = activityState?.turnUserId || room.hostId;
          const isMyTurn = String(turnUserId) === String(currentUserId);
          const choice = activityState?.truthOrDareChoice;
          const questionSubmitted = activityState?.questionSubmitted || false;

          const promptList = choice === "truth" ? TRUTH_PROMPTS : DARE_PROMPTS;
          const displayPromptText = activityState?.customPromptText || (choice && questionSubmitted ? promptList[currentPromptIndex % promptList.length] : null);
          const customAudioUrl = activityState?.customAudioUrl;

          return (
            <motion.div
              key={`tod-${currentPromptIndex}-${choice}-${questionSubmitted}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            >
              {/* Turn Banner */}
              <div className="w-full py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <Flame size={15} />
                {!choice
                  ? isMyTurn
                    ? "It's YOUR turn to pick Truth or Dare!"
                    : "Waiting for partner to pick Truth or Dare..."
                  : !questionSubmitted
                  ? isMyTurn
                    ? `You selected ${choice.toUpperCase()}! Waiting for partner to ask a question...`
                    : `Partner selected ${choice.toUpperCase()}! Ask them a question/challenge below:`
                  : `Active ${choice.toUpperCase()} Question`}
              </div>

              {/* Stage 1: Choice Selector (Truth vs Dare) */}
              {!choice && (
                <div className="flex items-center gap-3 my-2">
                  <button
                    disabled={!isMyTurn}
                    onClick={() => handleSelectTruthOrDare("truth")}
                    className={`flex-1 py-4 px-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      isMyTurn
                        ? "bg-gradient-to-b from-orange-500/20 to-red-500/20 border-red-500/50 hover:border-red-500 text-red-300 font-bold shadow-md"
                        : "bg-[var(--muted)] border-[var(--border)] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-2xl">🔥</span>
                    <span className="text-xs font-black uppercase">Truth</span>
                  </button>

                  <button
                    disabled={!isMyTurn}
                    onClick={() => handleSelectTruthOrDare("dare")}
                    className={`flex-1 py-4 px-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      isMyTurn
                        ? "bg-gradient-to-b from-amber-500/20 to-orange-500/20 border-orange-500/50 hover:border-orange-500 text-orange-300 font-bold shadow-md"
                        : "bg-[var(--muted)] border-[var(--border)] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="text-xs font-black uppercase">Dare</span>
                  </button>
                </div>
              )}

              {/* Stage 2: Question Input Form (Rendered for Partner / Asker when choice is selected but question not submitted) */}
              {choice && !questionSubmitted && (
                <>
                  {!isMyTurn ? (
                    /* Partner / Asker Form */
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--muted)] border border-red-500/30">
                      <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                        {choice === "truth" ? "🔥 Give Partner a Truth Question" : "⚡ Give Partner a Dare Challenge"}
                      </span>

                      {/* Question Source Mode Switcher */}
                      <div className="flex items-center gap-2 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => setTodMode("preset")}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            todMode === "preset"
                              ? "bg-red-500 text-white"
                              : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Dices size={13} /> Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => setTodMode("text")}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            todMode === "text"
                              ? "bg-red-500 text-white"
                              : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Edit3 size={13} /> Type Question
                        </button>
                        <button
                          type="button"
                          onClick={() => setTodMode("voice")}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            todMode === "voice"
                              ? "bg-red-500 text-white"
                              : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Mic size={13} /> Voice Note
                        </button>
                      </div>

                      {/* Preset Mode Info */}
                      {todMode === "preset" && (
                        <p className="text-xs text-[var(--foreground)] opacity-80 py-2 italic text-center">
                          A fun random {choice === "truth" ? "Truth question" : "Dare challenge"} will be picked from the bank!
                        </p>
                      )}

                      {/* Text Input Mode */}
                      {todMode === "text" && (
                        <textarea
                          rows={3}
                          value={customTodText}
                          onChange={(e) => setCustomTodText(e.target.value)}
                          placeholder={`Type your ${choice === "truth" ? "Truth question" : "Dare challenge"} for your partner...`}
                          className="w-full p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-red-500 transition"
                        />
                      )}

                      {/* Voice Recording Mode */}
                      {todMode === "voice" && (
                        <div className="flex flex-col items-center gap-3 py-3">
                          {!audioDataUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer ${
                                  isRecording
                                    ? "bg-red-600 animate-pulse scale-105"
                                    : "bg-red-500 hover:bg-red-600"
                                }`}
                              >
                                {isRecording ? <Square size={22} /> : <Mic size={24} />}
                              </button>
                              <span className="text-xs font-bold text-[var(--foreground)]">
                                {isRecording ? `Recording... 00:${recordingSeconds < 10 ? "0" : ""}${recordingSeconds}` : "Tap to Record Voice Question"}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--card)] border border-red-500/30">
                              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                <Volume2 size={15} /> Voice Note Recorded!
                              </span>
                              <audio src={audioDataUrl} controls className="w-full h-8" />
                              <button
                                type="button"
                                onClick={clearRecording}
                                className="text-[11px] font-bold text-rose-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                <Trash2 size={12} /> Re-record Voice Note
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleConfirmTruthOrDareQuestion}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        Send Question to Partner 🚀
                      </button>
                    </div>
                  ) : (
                    /* Waiting Indicator for Turn Player */
                    <div className="w-full py-6 px-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                      <Users size={24} />
                      <span>Waiting for partner to ask your {choice.toUpperCase()} question...</span>
                    </div>
                  )}
                </>
              )}

              {/* Stage 3 & 4: Active Question Display & Answer Box (Both Players) */}
              {choice && questionSubmitted && (
                <div className="flex flex-col gap-4">
                  {/* Active Question Box */}
                  <div className="w-full p-4 rounded-2xl bg-[var(--muted)] border border-red-500/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                        {choice === "truth" ? "🔥 TRUTH QUESTION" : "⚡ DARE CHALLENGE"}
                      </span>
                      {customAudioUrl && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 flex items-center gap-1">
                          <Mic size={11} /> Voice Question
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-extrabold text-[var(--foreground)] leading-relaxed">
                      {displayPromptText || "Listen to Voice Question 🎙️"}
                    </p>

                    {/* Audio Player for Recorded Question Voice Note */}
                    {customAudioUrl && (
                      <div className="w-full mt-2 p-2 rounded-xl bg-[var(--card)] border border-red-500/30">
                        <audio src={customAudioUrl} controls autoPlay className="w-full h-9" />
                      </div>
                    )}
                  </div>

                  {/* If Answer Not Revealed Yet */}
                  {!isRevealed ? (
                    isMyTurn ? (
                      /* Player 1 Answer Form */
                      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--muted)] border border-red-500/30">
                        <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                          ✍️ Submit Your Answer / Complete Dare
                        </span>

                        {/* Answer Mode Switcher */}
                        <div className="flex items-center gap-2 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setTodAnswerMode("text")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              todAnswerMode === "text"
                                ? "bg-red-500 text-white"
                                : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                            }`}
                          >
                            <Edit3 size={13} /> Type Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => setTodAnswerMode("voice")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              todAnswerMode === "voice"
                                ? "bg-red-500 text-white"
                                : "text-[var(--foreground)] opacity-70 hover:opacity-100"
                            }`}
                          >
                            <Mic size={13} /> Voice Answer
                          </button>
                        </div>

                        {/* Text Answer Input */}
                        {todAnswerMode === "text" && (
                          <textarea
                            rows={3}
                            value={todAnswerText}
                            onChange={(e) => setTodAnswerText(e.target.value)}
                            placeholder={`Type your ${choice === "truth" ? "answer to the truth question" : "result/proof for the dare"}...`}
                            className="w-full p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-red-500 transition"
                          />
                        )}

                        {/* Voice Answer Recording */}
                        {todAnswerMode === "voice" && (
                          <div className="flex flex-col items-center gap-3 py-3">
                            {!audioDataUrl ? (
                              <div className="flex flex-col items-center gap-2">
                                <button
                                  type="button"
                                  onClick={isRecording ? stopRecording : startRecording}
                                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer ${
                                    isRecording
                                      ? "bg-red-600 animate-pulse scale-105"
                                      : "bg-red-500 hover:bg-red-600"
                                  }`}
                                >
                                  {isRecording ? <Square size={22} /> : <Mic size={24} />}
                                </button>
                                <span className="text-xs font-bold text-[var(--foreground)]">
                                  {isRecording ? `Recording... 00:${recordingSeconds < 10 ? "0" : ""}${recordingSeconds}` : "Tap to Record Voice Answer"}
                                </span>
                              </div>
                            ) : (
                              <div className="w-full flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--card)] border border-red-500/30">
                                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                  <Volume2 size={15} /> Voice Answer Recorded!
                                </span>
                                <audio src={audioDataUrl} controls className="w-full h-8" />
                                <button
                                  type="button"
                                  onClick={clearRecording}
                                  className="text-[11px] font-bold text-rose-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                                >
                                  <Trash2 size={12} /> Re-record Voice Answer
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleConfirmTruthOrDareAnswer}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          Submit Answer / Done 🚀
                        </button>
                      </div>
                    ) : (
                      /* Player 2 Waiting Indicator */
                      <div className="w-full py-5 px-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold text-center flex flex-col items-center justify-center gap-2 animate-pulse">
                        <Users size={22} />
                        <span>Waiting for partner to answer/perform...</span>
                      </div>
                    )
                  ) : (
                    /* Stage 4: Answer Revealed to Both Players */
                    <div className="flex flex-col gap-3">
                      <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            ✨ Partner's Answer / Response
                          </span>
                          {activityState?.todAnswerAudioUrl && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                              <Mic size={11} /> Voice Answer
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-[var(--foreground)] leading-relaxed">
                          {activityState?.todAnswerText || "Listen to Voice Answer 🎙️"}
                        </p>

                        {activityState?.todAnswerAudioUrl && (
                          <div className="w-full mt-2 p-2 rounded-xl bg-[var(--card)] border border-emerald-500/30">
                            <audio src={activityState.todAnswerAudioUrl} controls autoPlay className="w-full h-9" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleNextPrompt}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        Next Turn <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 3. THIS OR THAT */}
        {currentActivityId === "this_or_that" && (() => {
          const promptObj = THIS_OR_THAT_PROMPTS[currentPromptIndex % THIS_OR_THAT_PROMPTS.length];
          const options = promptObj.options;

          return (
            <motion.div
              key={`tot-${currentPromptIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                  Comparison #{currentPromptIndex + 1}
                </span>
                <span className="text-[10px] font-bold text-[var(--foreground)] opacity-60">
                  This or That
                </span>
              </div>

              <h3 className="text-sm font-black text-center text-[var(--foreground)] opacity-80">
                {promptObj.prompt}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {options.map((opt, idx) => {
                  const isMyChoice = myAnswer === idx;
                  const isPartnerChoice = partnerAnswer === idx;

                  let cardStyle = "bg-[var(--muted)] border-[var(--border)] hover:border-purple-500/60";
                  if (hasMyAnswer && isMyChoice) {
                    cardStyle = "bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-md";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasMyAnswer}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`p-5 rounded-2xl border text-center font-black text-sm transition cursor-pointer flex flex-col items-center justify-center gap-3 ${cardStyle}`}
                    >
                      <span>{opt}</span>
                      {isRevealed && (
                        <div className="flex items-center gap-1">
                          {isMyChoice && <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-500 text-white font-bold">You</span>}
                          {isPartnerChoice && <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-500 text-white font-bold">Partner</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasMyAnswer && !isRevealed && (
                <div className="w-full py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <Users size={14} /> Waiting for partner's preference...
                </div>
              )}

              {isRevealed && (
                <div className="w-full flex flex-col items-center gap-3 pt-2">
                  <div
                    className={`w-full py-3 px-4 rounded-xl text-center font-black text-xs border ${
                      myAnswer === partnerAnswer
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    }`}
                  >
                    {myAnswer === partnerAnswer
                      ? "✨ Perfect match! You both selected the same!"
                      : "😄 Different choices! Variety is the spice of life!"}
                  </div>

                  <button
                    onClick={handleNextPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Next Choice <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 4. DAILY QUESTION */}
        {currentActivityId === "daily_question" && (() => {
          const questionText = DAILY_QUESTIONS[currentPromptIndex % DAILY_QUESTIONS.length];

          return (
            <motion.div
              key={`dq-${currentPromptIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                  Daily Reflection #{currentPromptIndex + 1}
                </span>
                <span className="text-[10px] font-bold text-[var(--foreground)] opacity-60">
                  Daily Question
                </span>
              </div>

              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <h3 className="text-sm font-extrabold text-[var(--foreground)] text-center leading-relaxed">
                  "{questionText}"
                </h3>
              </div>

              {!hasMyAnswer && (
                <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
                  <textarea
                    rows={3}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your thoughtful response here..."
                    className="w-full p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow cursor-pointer"
                  >
                    Submit Response ✍️
                  </button>
                </form>
              )}

              {hasMyAnswer && !isRevealed && (
                <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <Users size={14} /> Answer saved! Waiting for partner to answer...
                </div>
              )}

              {isRevealed && (
                <div className="w-full flex flex-col gap-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[var(--muted)] border border-emerald-500/30 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-emerald-400 uppercase">Your Answer</span>
                      <p className="text-xs text-[var(--foreground)] font-medium">{String(myAnswer)}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--muted)] border border-teal-500/30 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-teal-400 uppercase">Partner's Answer</span>
                      <p className="text-xs text-[var(--foreground)] font-medium">{String(partnerAnswer)}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleNextPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Next Question <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 5. COUPLE QUESTIONS */}
        {currentActivityId === "couple_questions" && (() => {
          const currentCategory = activityState?.category || "fun";
          const categoryPrompts = COUPLE_QUESTIONS_BY_CATEGORY[currentCategory] || COUPLE_QUESTIONS_BY_CATEGORY.fun;
          const promptText = categoryPrompts[currentPromptIndex % categoryPrompts.length];

          return (
            <motion.div
              key={`cq-${currentCategory}-${currentPromptIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            >
              {/* Category Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["fun", "memories", "preferences", "future", "random"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSwitchCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition cursor-pointer shrink-0 ${
                      currentCategory === cat
                        ? "bg-amber-500 text-white shadow"
                        : "bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Category: {currentCategory}
                </span>
                <h3 className="text-sm font-extrabold text-[var(--foreground)] mt-1 leading-relaxed">
                  "{promptText}"
                </h3>
              </div>

              {!hasMyAnswer && (
                <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
                  <textarea
                    rows={3}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-black shadow cursor-pointer"
                  >
                    Share Answer 💬
                  </button>
                </form>
              )}

              {hasMyAnswer && !isRevealed && (
                <div className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <Users size={14} /> Answer shared! Waiting for partner...
                </div>
              )}

              {isRevealed && (
                <div className="w-full flex flex-col gap-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[var(--muted)] border border-amber-500/30 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-amber-400 uppercase">You</span>
                      <p className="text-xs text-[var(--foreground)] font-medium">{String(myAnswer)}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--muted)] border border-yellow-500/30 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-yellow-400 uppercase">Partner</span>
                      <p className="text-xs text-[var(--foreground)] font-medium">{String(partnerAnswer)}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleNextPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-black shadow-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Next Prompt <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
