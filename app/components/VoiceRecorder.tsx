"use client";

import React, { useRef, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";

interface VoiceRecorderProps {
  onSend: (audioBlob: File) => void;
}

export default function VoiceRecorder({ onSend }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunks.current = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const file = new File([blob], `voice_${Date.now()}.webm`, {
        type: "audio/webm",
      });
      onSend(file);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex items-center cursor-pointer space-x-2">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`p-2 rounded-full ${
          recording ? "bg-red-500 animate-pulse" : "bg-[var(--card)]"
        } text-white border-1 border-[var(--accent)] hover:bg-[var(--accent)]/15 transition`}
        title={recording ? "Stop Recording" : "Start Recording"}
      >
        {recording ? <FaStop className=" cursor-pointer"/> : <FaMicrophone className=" cursor-pointer"/>}
      </button>
    </div>
  );
}
