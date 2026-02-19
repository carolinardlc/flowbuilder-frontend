"use client";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Se cierra solo en 5s
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${styles[type]}`}>
      <span className="text-xl">
        {type === "error" ? "⚠️" : type === "success" ? "✅" : "Rx"}
      </span>
      <div className="flex flex-col">
        <span className="font-semibold text-sm capitalize">
          {type === "error" ? "Error" : type === "success" ? "Éxito" : "Aviso"}
        </span>
        <span className="text-sm opacity-90">{message}</span>
      </div>
      <button onClick={onClose} className="ml-2 hover:bg-black/5 rounded-full p-1">✕</button>
    </div>
  );
}