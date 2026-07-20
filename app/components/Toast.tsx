"use client";
import React from "react";
import { atom, useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export interface ToastItem {
  id: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const toastsAtom = atom<ToastItem[]>([]);

let toastIdCounter = 0;

export function showToast(
  message: string,
  type: "success" | "error" | "info" | "warning" = "info",
  duration = 3500
) {
  if (typeof window === "undefined") return;
  const id = `toast-${Date.now()}-${++toastIdCounter}`;

  window.dispatchEvent(
    new CustomEvent("chugli-toast", {
      detail: { id, message, type, duration },
    })
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useAtom(toastsAtom);

  React.useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      const newToast = customEvent.detail;

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 3500);
    };

    window.addEventListener("chugli-toast", handleToastEvent);
    return () => window.removeEventListener("chugli-toast", handleToastEvent);
  }, [setToasts]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-md text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/30 text-rose-200"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/30 text-amber-200"
                : "bg-slate-900/90 border-slate-700 text-slate-100"
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 break-words leading-tight">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:opacity-75 transition rounded-lg text-current cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
