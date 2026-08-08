"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, RotateCcw, LogOut, MessageSquare, Send, CheckCircle2, XCircle, Handshake, Users, Mic, Square, Volume2, Plus, Gamepad2 } from "lucide-react";
import { QuizState, GameStats, TogetherRoom } from "../../states/togetherTypes";

interface QuizBoardProps {
  room: TogetherRoom;
  currentUserId: string;
  onEmit: (event: string, data: any) => void;
  onLeaveRoom: () => void;
}

export const QuizBoard: React.FC<QuizBoardProps> = ({
  room,
  currentUserId,
  onEmit,
  onLeaveRoom,
}) => {
  const quizState = (room.state.quiz || {}) as QuizState;
  const {
    currentQuestionIndex = 0,
    questions = [],
    answers = {},
    scores = {},
    status = "playing",
    winner = null,
    comments = [],
    askerId = null,
    mode = "couple",
  } = quizState;

  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(true);

  // Custom question creation state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [customOptions, setCustomOptions] = useState(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const participants = room.participants || [];
  const partnerId = participants.find((id) => id !== currentUserId) || "Partner";

  const myScore = scores[currentUserId] || 0;
  const partnerScore = scores[partnerId] || 0;

  const myAnswers = answers[currentUserId] || {};
  const currentQuestion = questions[currentQuestionIndex];
  const mySelectedOption = currentQuestion ? myAnswers[currentQuestionIndex] : undefined;
  const hasAnsweredCurrent = mySelectedOption !== undefined;

  const sessionStats: GameStats = room.sessionStats?.[currentUserId] || {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
  };

  const handleStartGame = () => {
    onEmit("together:quiz:startGame", { roomId: room.roomId });
  };

  const handleSelectFirstPlayer = (firstPlayerId: string) => {
    onEmit("together:quiz:swapFirstTurn", { roomId: room.roomId, firstPlayerId });
  };

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnsweredCurrent || status === "finished") return;
    onEmit("together:quiz:submitAnswer", {
      roomId: room.roomId,
      questionIndex: currentQuestionIndex,
      optionIndex,
    });
  };

  const handleRestart = () => {
    onEmit("together:quiz:restart", { roomId: room.roomId });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onEmit("together:tictactoe:comment", { roomId: room.roomId, text: commentInput });
    setCommentInput("");
  };

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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

  // Voice recording handlers
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

        if (blob.size === 0) {
          console.warn("Recorded audio blob is empty");
        }

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
    } catch (err) {
      console.error("Microphone permission or recording error:", err);
      alert("Microphone permission is required to record voice notes. Please allow mic access in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmitCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionText.trim() && !audioDataUrl) return;

    onEmit("together:quiz:submitCustomQuestion", {
      roomId: room.roomId,
      questionText: customQuestionText.trim() || "Listen to Voice Question 🎙️",
      audioData: audioDataUrl,
      options: customOptions.map((opt, i) => opt.trim() || `Option ${i + 1}`),
      correctIndex: correctOptionIdx,
    });

    setCustomQuestionText("");
    setAudioDataUrl(null);
    setShowCustomModal(false);
  };

  const playAudioData = (srcUrl: string) => {
    try {
      const snd = new Audio(srcUrl);
      snd.play().catch((e) => console.error("Audio play error:", e));
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 max-w-xl sm:max-w-2xl mx-auto p-2">
      {/* ─── Top Header & Stats Bar ─── */}
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡❓</span>
            <div>
              <h2 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                Trivia & Voice Quiz
              </h2>
              <p className="text-[10px] text-[var(--foreground)] opacity-60 font-bold">
                {status === "finished"
                  ? "Quiz Complete!"
                  : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition cursor-pointer"
              title="Reset Quiz"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onLeaveRoom}
              className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
              title="Leave Room"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Live Session Stats */}
        <div className="w-full bg-[var(--muted)]/50 rounded-xl py-1 px-2.5 border border-[var(--border)] flex items-center justify-between text-[10px] font-extrabold text-[var(--foreground)]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Trophy size={11} /> {sessionStats.wins} Wins
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <XCircle size={11} /> {sessionStats.losses} Losses
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Handshake size={11} /> {sessionStats.ties} Ties
          </span>
          <span className="opacity-60">{sessionStats.total} Total</span>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col items-center p-2 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase">Your Score</span>
            <span className="text-xl font-black text-violet-300">{myScore} pts</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-[10px] font-bold text-purple-400 uppercase">Partner Score</span>
            <span className="text-xl font-black text-purple-300">{partnerScore} pts</span>
          </div>
        </div>
      </div>

      {/* ─── Status Screen / Setup Screen ─── */}
      <AnimatePresence mode="wait">
        {status === "waiting" && (
          <div className="w-full py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <Users size={14} className="animate-bounce" />
            Waiting for a friend to join Quiz...
          </div>
        )}

        {status === "setup" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-3 rounded-2xl bg-[var(--card)] border border-[var(--accent)]/40 shadow-xl flex flex-col items-center gap-2.5"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
              <Sparkles size={14} className="text-[var(--accent)] animate-spin" />
              <span>Who Asks / Starts First? Select & Launch</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => handleSelectFirstPlayer(currentUserId)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${askerId === currentUserId
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70"
                  }`}
              >
                👤 You Ask First
              </button>
              <button
                onClick={() => handleSelectFirstPlayer(partnerId)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${askerId === partnerId
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-[var(--muted)] text-[var(--foreground)] opacity-70"
                  }`}
              >
                👥 Partner Asks First
              </button>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow cursor-pointer"
            >
              🚀 Launch Trivia & Voice Quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Question Card & Options ─── */}
      {status === "playing" && (
        <div className="w-full flex flex-col gap-3">
          {/* Add Custom Question Button */}
          {askerId === currentUserId && (
            <button
              onClick={() => setShowCustomModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition cursor-pointer"
            >
              <Plus size={15} /> Your Turn to Ask: Create Text or Voice Question 🎙️
            </button>
          )}

          {!currentQuestion && questions.length === 0 && (
            <div className="w-full bg-[var(--card)] border-2 border-dashed border-[var(--accent)]/50 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-2xl shadow">
                🎙️
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--foreground)]">
                  {askerId === currentUserId ? "It's Your Turn to Ask!" : "Waiting for Partner to Ask..."}
                </h3>
                <p className="text-xs text-[var(--foreground)] opacity-70 mt-1 font-medium">
                  {askerId === currentUserId
                    ? "Record a voice note or type a custom question with options for your partner."
                    : "Your partner is choosing/recording their question."}
                </p>
              </div>
              {askerId === currentUserId && (
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} /> Create Text / Voice Question 🎙️
                </button>
              )}
            </div>
          )}

          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                  Question {currentQuestionIndex + 1}
                </span>
                {currentQuestion.audioData && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Volume2 size={12} /> Voice Note Attached
                  </span>
                )}
              </div>

              <h3 className="text-xs font-extrabold text-[var(--foreground)] leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* Audio player if voice attached */}
              {currentQuestion.audioData && (
                <div className="w-full p-2.5 bg-[var(--muted)] rounded-xl border border-[var(--border)] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">🎙️ Voice Note Audio</span>
                    <button
                      type="button"
                      onClick={() => playAudioData(currentQuestion.audioData!)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition cursor-pointer"
                    >
                      <Volume2 size={13} /> Listen / Play
                    </button>
                  </div>
                  <audio key={currentQuestion.audioData} controls preload="auto" playsInline src={currentQuestion.audioData} className="w-full h-8" />
                </div>
              )}

              {/* Creator vs Answerer Notice */}
              {String(currentQuestion.askerId) === String(currentUserId) ? (
                <div className="w-full py-2 px-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <span>✍️ You created this question! Waiting for partner to answer...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = Number(mySelectedOption) === optIdx;
                    const isCorrect = Number(currentQuestion.correctIndex) === optIdx;

                    let optionStyle = "bg-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]";
                    if (hasAnsweredCurrent) {
                      if (isSelected && isCorrect) {
                        optionStyle = "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-rose-500/20 border-rose-400 text-rose-300 font-bold";
                      } else if (isCorrect) {
                        optionStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAnsweredCurrent}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnsweredCurrent && isSelected && (
                          isCorrect ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {hasAnsweredCurrent && (
                <p className="text-[10px] text-center text-[var(--foreground)] opacity-60 font-semibold animate-pulse">
                  Answer submitted! Rotating to next player's turn...
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ─── Custom Text or Voice Question Modal ─── */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3"
            >
              <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
                <Mic size={16} className="text-[var(--accent)]" /> Ask Text or Voice Question
              </h3>
              <p className="text-[11px] text-[var(--foreground)] opacity-60">
                Record a quick voice question or type custom text. (Auto-purged after match!)
              </p>

              {/* Voice Recorder */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--foreground)]">Voice Note:</span>
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold animate-pulse cursor-pointer"
                  >
                    <Square size={12} /> Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    <Mic size={12} /> Record Voice
                  </button>
                )}
              </div>

              {audioDataUrl && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-emerald-400">Preview Voice Note:</p>
                    <button
                      type="button"
                      onClick={() => playAudioData(audioDataUrl)}
                      className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition cursor-pointer"
                    >
                      <Volume2 size={12} /> Test Play
                    </button>
                  </div>
                  <audio key={audioDataUrl} controls preload="auto" playsInline src={audioDataUrl} className="w-full h-8" />
                </div>
              )}

              {/* Text Question */}
              <input
                type="text"
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="Or type custom question here..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />

              {/* 4 Options */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[var(--foreground)] opacity-70">Options (Select radio for correct answer):</span>
                {customOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={correctOptionIdx === i}
                      onChange={() => setCorrectOptionIdx(i)}
                      className="accent-[var(--accent)]"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...customOptions];
                        newOpts[i] = e.target.value;
                        setCustomOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-2.5 py-1 rounded-lg bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCustomQuestion}
                  className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  Add Question
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Game Over Popup Modal ─── */}
      <AnimatePresence>
        {status === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-3xl shadow-inner">
                {winner ? "🏆" : "🤝"}
              </div>

              <div>
                <h3 className="text-lg font-black text-[var(--foreground)]">
                  {winner ? (winner === currentUserId ? "You Won! 🎉" : "Partner Won!") : "It's a Tie! 🤝"}
                </h3>
                <p className="text-xs text-[var(--foreground)] opacity-70 mt-1 font-medium">
                  Great Quiz Duel! What would you like to do next?
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={handleRestart}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Rematch Game
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                >
                  <Gamepad2 size={14} />
                  Switch Game
                </button>
                <button
                  onClick={onLeaveRoom}
                  className="w-full py-2 px-4 rounded-xl bg-[var(--muted)] text-[var(--foreground)] opacity-70 hover:opacity-100 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel / Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Live Comments ─── */}
      <div className="w-full bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)] p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 opacity-80">
            <MessageSquare size={13} /> Live Comments
          </span>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-[10px] text-[var(--accent)] font-semibold hover:underline cursor-pointer"
          >
            {showComments ? "Hide" : "Show"} ({comments.length})
          </button>
        </div>

        {showComments && (
          <>
            <div className="max-h-24 overflow-y-auto flex flex-col gap-1.5 p-1 no-scrollbar">
              {comments.length === 0 ? (
                <p className="text-[11px] text-[var(--foreground)] opacity-50 italic text-center py-2">
                  No comments yet. Send a quick chant!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`text-[11px] p-1.5 rounded-xl max-w-[85%] font-medium ${c.senderId === currentUserId
                        ? "bg-[var(--accent)] text-white self-end"
                        : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] self-start"
                      }`}
                  >
                    {c.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer"
              >
                <Send size={12} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
