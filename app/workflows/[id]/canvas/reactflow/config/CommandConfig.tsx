"use client";

// This form edits command node configuration including arguments and env vars.
// It favors simple controls that match the destination styling.

import { useEffect, useState } from "react";
import type { CommandConfig } from "../types";
import KeyValueEditor, { type KeyValueRow } from "./KeyValueEditor";
import { generateId } from "../workflow-utils";

type CommandConfigProps = {
  config: CommandConfig;
  onChange: (config: CommandConfig) => void;
};

// Transform dictionaries into editable rows.
const rowsFromObject = (obj: Record<string, string>): KeyValueRow[] =>
  Object.entries(obj).map(([key, value]) => ({
    id: generateId(),
    key,
    value,
  }));

// Transform rows back into dictionaries, ignoring empty keys.
const objectFromRows = (rows: KeyValueRow[]): Record<string, string> =>
  rows.reduce<Record<string, string>>((acc, row) => {
    if (!row.key.trim()) return acc;
    acc[row.key.trim()] = row.value;
    return acc;
  }, {});

export default function CommandConfigForm({
  config,
  onChange,
}: CommandConfigProps) {
  const [envRows, setEnvRows] = useState<KeyValueRow[]>(() =>
    rowsFromObject(config.envVars ?? {})
  );
  const [outputRows, setOutputRows] = useState<KeyValueRow[]>(() =>
    rowsFromObject(config.outputMapping ?? {})
  );
  const [argumentText, setArgumentText] = useState(
    config.arguments.join("\n")
  );

  // Sync internal state when the selected node changes.
  useEffect(() => {
    setEnvRows(rowsFromObject(config.envVars ?? {}));
    setOutputRows(rowsFromObject(config.outputMapping ?? {}));
    setArgumentText(config.arguments.join("\n"));
  }, [config.arguments, config.envVars, config.outputMapping]);

  // Local helper keeps updates consistent.
  const updateConfig = (partial: Partial<CommandConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="rf-inspector-section">
      <div className="rf-form-grid">
        <div className="rf-form-field">
          <label className="form-label" htmlFor="command-name">
            Comando
          </label>
          <input
            id="command-name"
            className="form-input"
            placeholder="npm"
            value={config.command ?? ""}
            onChange={(event) => updateConfig({ command: event.target.value })}
          />
        </div>

        <div className="rf-form-field">
          <label className="form-label" htmlFor="command-workdir">
            Working directory
          </label>
          <input
            id="command-workdir"
            className="form-input"
            placeholder="/ruta/proyecto"
            value={config.workingDirectory ?? ""}
            onChange={(event) =>
              updateConfig({ workingDirectory: event.target.value })
            }
          />
        </div>
      </div>

      <div className="rf-form-grid">
        <div className="rf-form-field">
          <label className="form-label" htmlFor="command-timeout">
            Timeout (s)
          </label>
          <input
            id="command-timeout"
            className="form-input"
            type="number"
            min={0}
            value={config.timeout ?? 0}
            onChange={(event) =>
              updateConfig({ timeout: Number(event.target.value) || 0 })
            }
          />
        </div>

        <div className="rf-form-field">
          <label className="form-label" htmlFor="command-output">
            Capturar salida
          </label>
          <select
            id="command-output"
            className="form-input rf-select"
            value={config.captureOutput ? "yes" : "no"}
            onChange={(event) =>
              updateConfig({ captureOutput: event.target.value === "yes" })
            }
          >
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className="rf-form-field">
        <label className="form-label" htmlFor="command-args">
          Argumentos (uno por línea)
        </label>
        <textarea
          id="command-args"
          className="form-textarea"
          rows={3}
          value={argumentText}
          onChange={(event) => {
            const value = event.target.value;
            setArgumentText(value);
            updateConfig({
              arguments: value
                .split("\n")
                .map((entry) => entry.trim())
                .filter(Boolean),
            });
          }}
        />
      </div>

      <KeyValueEditor
        label="Variables de entorno"
        rows={envRows}
        onChange={(rows) => {
          setEnvRows(rows);
          updateConfig({ envVars: objectFromRows(rows) });
        }}
        addLabel="Agregar variable"
      />

      <KeyValueEditor
        label="Output mapping"
        rows={outputRows}
        onChange={(rows) => {
          setOutputRows(rows);
          updateConfig({ outputMapping: objectFromRows(rows) });
        }}
        addLabel="Agregar mapping"
      />
    </div>
  );
}
