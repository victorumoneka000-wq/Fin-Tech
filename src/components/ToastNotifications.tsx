import React from "react";
import { AlertTriangle, Clock, CheckCircle, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastNotificationsProps {
  toasts: Toast[];
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

export default function ToastNotifications({ toasts, setToasts }: ToastNotificationsProps) {
  return (
    <div id="toast-portal" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn pointer-events-auto text-xs font-semibold text-white ${
            toast.type === "error"
              ? "bg-rose-600 border-rose-700"
              : toast.type === "info"
              ? "bg-slate-800 border-slate-900"
              : "bg-emerald-600 border-emerald-700"
          }`}
        >
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.type === "info" && <Clock className="w-4 h-4 shrink-0" />}
          {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-white hover:text-slate-200 transition-colors shrink-0 ml-1.5 font-bold"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
