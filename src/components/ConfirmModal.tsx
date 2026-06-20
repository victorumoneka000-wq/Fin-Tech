import React from "react";
import { HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div id="confirm-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 font-display">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{message}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              onClose();
            }}
            className="px-4 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors shadow-md shadow-indigo-100"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
