"use client";

type StatusModalProps = {
  isOpen: boolean;
  title: string;
  status?: "ok" | "error";
  message?: string;
  messages?: string[];
  introText?: string;
  closeLabel?: string;
  onClose: () => void;
};

export default function StatusModal({
  isOpen,
  title,
  status,
  message,
  messages,
  introText,
  closeLabel = "Cerrar",
  onClose,
}: StatusModalProps) {
  if (!isOpen) return null;

  const toneColor =
    status === "ok" ? "#2f7d67" : status === "error" ? "#c45757" : undefined;
  const hasList = Array.isArray(messages) && messages.length > 0;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2 className="workflows-title">{title}</h2>
        {message ? (
          <p className="workflows-subtitle" style={toneColor ? { color: toneColor } : undefined}>
            {message}
          </p>
        ) : null}
        {introText ? <p className="workflows-subtitle">{introText}</p> : null}
        {hasList ? (
          <ul style={{ margin: 0, paddingLeft: "18px", color: toneColor }}>
            {messages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
