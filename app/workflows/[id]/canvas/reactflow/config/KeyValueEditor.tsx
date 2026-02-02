"use client";

// This helper renders a flexible key/value editor with add/remove controls.
// It is reused across config forms to keep UI behavior consistent.

import { generateId } from "../workflow-utils";

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
};

type KeyValueEditorProps = {
  label: string;
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  addLabel?: string;
};

export default function KeyValueEditor({
  label,
  rows,
  onChange,
  addLabel = "Agregar",
}: KeyValueEditorProps) {
  // Update a single row by id while keeping the list immutable.
  const updateRow = (rowId: string, field: "key" | "value", value: string) => {
    onChange(
      rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // Add a blank row so users can enter new key/value pairs.
  const addRow = () => {
    onChange([...rows, { id: generateId(), key: "", value: "" }]);
  };

  // Remove a row by id to keep the list tidy.
  const removeRow = (rowId: string) => {
    onChange(rows.filter((row) => row.id !== rowId));
  };

  return (
    <div className="rf-inspector-block">
      <p className="rf-inspector-label">{label}</p>
      <div className="rf-kv-list">
        {rows.map((row) => (
          <div key={row.id} className="rf-kv-row">
            <input
              className="form-input rf-kv-input"
              placeholder="Clave"
              value={row.key}
              onChange={(event) => updateRow(row.id, "key", event.target.value)}
            />
            <input
              className="form-input rf-kv-input"
              placeholder="Valor"
              value={row.value}
              onChange={(event) =>
                updateRow(row.id, "value", event.target.value)
              }
            />
            <button
              type="button"
              className="rf-kv-remove"
              onClick={() => removeRow(row.id)}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary" onClick={addRow}>
        {addLabel}
      </button>
    </div>
  );
}
