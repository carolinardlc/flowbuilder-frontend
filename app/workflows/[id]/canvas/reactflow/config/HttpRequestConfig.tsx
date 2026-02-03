"use client";

// This form edits HTTP request node configuration with key/value editors.
// It keeps draft state locally and pushes normalized objects upward.

import { useEffect, useMemo, useState } from "react";
import type { HttpRequestConfig } from "../types";
import KeyValueEditor, { type KeyValueRow } from "./KeyValueEditor";
import { generateId } from "../workflow-utils";

type HttpRequestConfigProps = {
  config: HttpRequestConfig;
  onChange: (config: HttpRequestConfig) => void;
};

// Convert a dictionary into editable rows.
const rowsFromObject = (obj: Record<string, string>): KeyValueRow[] =>
  Object.entries(obj).map(([key, value]) => ({
    id: generateId(),
    key,
    value,
  }));

// Convert rows to a dictionary, ignoring empty keys.
const objectFromRows = (rows: KeyValueRow[]): Record<string, string> =>
  rows.reduce<Record<string, string>>((acc, row) => {
    if (!row.key.trim()) return acc;
    acc[row.key.trim()] = row.value;
    return acc;
  }, {});

export default function HttpRequestConfigForm({
  config,
  onChange,
}: HttpRequestConfigProps) {
  // Local row state supports empty rows without breaking config integrity.
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>(() =>
    rowsFromObject(config.headers)
  );
  const [queryRows, setQueryRows] = useState<KeyValueRow[]>(() =>
    rowsFromObject(config.queryParams)
  );
  const [responseRows, setResponseRows] = useState<KeyValueRow[]>(() =>
    rowsFromObject(config.responseMapping)
  );

  // Sync rows when the config changes externally (e.g., node switch).
  useEffect(() => {
    setHeaderRows(rowsFromObject(config.headers));
    setQueryRows(rowsFromObject(config.queryParams));
    setResponseRows(rowsFromObject(config.responseMapping));
  }, [config.headers, config.queryParams, config.responseMapping]);

  // Shared helper to update the config payload consistently.
  const updateConfig = (partial: Partial<HttpRequestConfig>) => {
    onChange({ ...config, ...partial });
  };

  // Memoized select options keep rendering stable.
  const methodOptions = useMemo(
    () => ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    []
  );

  return (
    <div className="rf-inspector-section">
      <div className="rf-form-grid">
        <div className="rf-form-field">
          <label className="form-label" htmlFor="http-method">
            Método
          </label>
          <select
            id="http-method"
            className="form-input rf-select"
            value={config.method ?? "GET"}
            onChange={(event) =>
              updateConfig({ method: event.target.value as HttpRequestConfig["method"] })
            }
          >
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="rf-form-field">
          <label className="form-label" htmlFor="http-url">
            URL
          </label>
          <input
            id="http-url"
            className="form-input"
            placeholder="https://api.ejemplo.com"
            value={config.url ?? ""}
            onChange={(event) => updateConfig({ url: event.target.value })}
          />
        </div>
      </div>

      <div className="rf-form-grid">
        <div className="rf-form-field">
          <label className="form-label" htmlFor="http-body-type">
            Body type
          </label>
          <select
            id="http-body-type"
            className="form-input rf-select"
            value={config.bodyType ?? "json"}
            onChange={(event) =>
              updateConfig({
                bodyType: event.target.value as HttpRequestConfig["bodyType"],
              })
            }
          >
            <option value="json">JSON</option>
            <option value="text">Texto</option>
          </select>
        </div>

        <div className="rf-form-field">
          <label className="form-label" htmlFor="http-timeout">
            Timeout (s)
          </label>
          <input
            id="http-timeout"
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
          <label className="form-label" htmlFor="http-retries">
            Reintentos
          </label>
          <input
            id="http-retries"
            className="form-input"
            type="number"
            min={0}
            value={config.retries ?? 0}
            onChange={(event) =>
              updateConfig({ retries: Number(event.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="rf-form-field">
        <label className="form-label" htmlFor="http-body">
          Body (JSON o texto)
        </label>
        <textarea
          id="http-body"
          className="form-textarea"
          rows={4}
          value={config.body ?? ""}
          onChange={(event) => updateConfig({ body: event.target.value })}
        />
      </div>

      <KeyValueEditor
        label="Headers"
        rows={headerRows}
        onChange={(rows) => {
          setHeaderRows(rows);
          updateConfig({ headers: objectFromRows(rows) });
        }}
        addLabel="Agregar header"
      />

      <KeyValueEditor
        label="Query params"
        rows={queryRows}
        onChange={(rows) => {
          setQueryRows(rows);
          updateConfig({ queryParams: objectFromRows(rows) });
        }}
        addLabel="Agregar parámetro"
      />

      <KeyValueEditor
        label="Response mapping"
        rows={responseRows}
        onChange={(rows) => {
          setResponseRows(rows);
          updateConfig({ responseMapping: objectFromRows(rows) });
        }}
        addLabel="Agregar mapping"
      />
    </div>
  );
}
