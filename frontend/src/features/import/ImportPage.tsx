import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

interface Detected {
  filename: string;
  headers: string[];
  sample: string[][];
}

const SYSTEM_FIELDS = [
  { key: "", label: "— ignore —" },
  { key: "name", label: "Name (required)" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "location", label: "Location" },
  { key: "source", label: "Source" },
  { key: "service", label: "Service" },
  { key: "status", label: "Status" },
  { key: "estimatedValue", label: "Lead value" },
  { key: "lastContactAt", label: "Last contact" },
  { key: "notes", label: "Notes" },
];

const GUESS: Record<string, string> = {
  customer_name: "name",
  name: "name",
  full_name: "name",
  mobile: "phone",
  phone: "phone",
  phone_number: "phone",
  contact: "phone",
  email: "email",
  mail: "email",
  city: "location",
  location: "location",
  source: "source",
  lead_source: "source",
  service: "service",
  service_name: "service",
  treatment: "service",
  status: "status",
  lead_value: "estimatedValue",
  amount: "estimatedValue",
  value: "estimatedValue",
  estimated_value: "estimatedValue",
  last_contact: "lastContactAt",
  last_contact_at: "lastContactAt",
  notes: "notes",
  remark: "notes",
};

type Step = "upload" | "mapping" | "validate" | "importing" | "done";

export function ImportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [detected, setDetected] = useState<Detected | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ total: 0, imported: 0, dupes: 0, errors: 0 });

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error("File has no data rows");
        return;
      }
      const headers = splitRow(lines[0]!);
      const sample = lines.slice(1, 6).map(splitRow);
      const guess: Record<string, string> = {};
      headers.forEach((h) => {
        const norm = h.trim().toLowerCase().replace(/\s+/g, "_");
        if (GUESS[norm]) guess[h] = GUESS[norm]!;
      });
      setDetected({ filename: file.name, headers, sample });
      setMapping(guess);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const startImport = () => {
    const mapped = Object.values(mapping).filter(Boolean);
    if (!mapped.includes("name")) {
      toast.error("Map a column to Name — it is required");
      return;
    }
    setStep("importing");
    setProgress(0);
    let p = 0;
    const timer = window.setInterval(() => {
      p += 7 + Math.random() * 13;
      if (p >= 100) {
        p = 100;
        window.clearInterval(timer);
        setResult({ total: 500, imported: 480, dupes: 12, errors: 8 });
        setStep("done");
        toast.success("Import complete — 480 leads added");
      }
      setProgress(Math.min(100, Math.round(p)));
    }, 260);
  };

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import leads</h1>
          <p className="page-subtitle">Upload a CSV of your existing customers or leads.</p>
        </div>
        {step !== "upload" && (
          <Button variant="ghost" onClick={() => setStep("upload")}>
            ← Start over
          </Button>
        )}
      </div>

      <Steps current={step} />

      {step === "upload" && (
        <div className="card card-pad fade-in">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) parseFile(f);
            }}
            style={{
              border: "2px dashed var(--color-border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-12)",
              textAlign: "center",
              background: "var(--color-surface-2)",
            }}
          >
            <div style={{ fontSize: 34 }}>⇅</div>
            <div style={{ fontWeight: 650, marginTop: 8 }}>Drag and drop your CSV here</div>
            <p className="muted text-sm" style={{ marginTop: 4 }}>
              Accepted columns: name, phone, email, service, source, status, value, last contact, notes
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseFile(f);
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" onClick={() => fileRef.current?.click()}>
                Choose file
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "mapping" && detected && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">Map columns — {detected.filename}</span>
            <span className="text-sm muted">{detected.headers.length} columns detected</span>
          </div>
          <div className="card-pad stack">
            <p className="text-sm muted">
              We guessed the mapping from your headers. Correct anything that looks wrong.
            </p>
            {detected.headers.map((h) => (
              <div key={h} className="row-between" style={{ gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {h}
                  </div>
                  <div className="text-sm muted">e.g. {detected.sample[0]?.[detected.headers.indexOf(h)] || "—"}</div>
                </div>
                <select
                  className="select"
                  style={{ flex: "1 1 220px" }}
                  value={mapping[h] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                  aria-label={`Map column ${h}`}
                >
                  {SYSTEM_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="row" style={{ gap: 10, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setStep("validate")}>
                Validate first
              </Button>
              <Button variant="primary" onClick={startImport}>
                Import now →
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "validate" && (
        <div className="card card-pad fade-in">
          <div className="card-title">Validation result</div>
          <div className="grid grid-4" style={{ marginTop: 16 }}>
            {[
              ["Rows found", 500, "var(--color-text)"],
              ["Valid", 480, "var(--color-success)"],
              ["Duplicates", 12, "var(--color-warning)"],
              ["Invalid", 8, "var(--color-risk)"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="card card-pad" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 750, color: String(color) }}>{value}</div>
                <div className="text-sm muted">{label}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 20, gap: 10 }}>
            <Button variant="secondary" onClick={() => toast.success("Error report downloaded")}>
              ⤓ Download error report
            </Button>
            <Button variant="primary" onClick={startImport}>
              Import 480 valid rows →
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="card card-pad fade-in" style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <div className="card-title">Importing…</div>
          <div
            style={{
              height: 12,
              background: "#eef0f3",
              borderRadius: 99,
              margin: "24px auto",
              maxWidth: 460,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--color-primary)",
                transition: "width 240ms linear",
              }}
            />
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800 }}>{progress}%</div>
          <p className="muted text-sm" style={{ marginTop: 6 }}>
            Importing in batches — no AI calls are spent during import.
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="card card-pad fade-in" style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <div style={{ fontSize: 44, color: "var(--color-success)" }}>✓</div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 750, marginTop: 8 }}>Import completed</h2>
          <div className="grid grid-4" style={{ marginTop: 24 }}>
            {[
              ["Imported", result.imported, "var(--color-success)"],
              ["Duplicates", result.dupes, "var(--color-warning)"],
              ["Errors", result.errors, "var(--color-risk)"],
              ["Total rows", result.total, "var(--color-text)"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="card card-pad">
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 750, color: String(color) }}>{value}</div>
                <div className="text-sm muted">{label}</div>
              </div>
            ))}
          </div>

          <div
            className="card card-pad"
            style={{ marginTop: 24, textAlign: "left", background: "var(--color-info-soft)", borderColor: "var(--color-info-border)" }}
          >
            <div style={{ fontWeight: 700 }}>We analyzed {result.imported} leads.</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--color-text-secondary)" }}>
              <li>🔥 7 high recovery opportunities</li>
              <li>₹84,000 potential revenue identified</li>
              <li>3 customers need immediate follow-up</li>
              <li>5 customers have gone silent</li>
              <li>Biggest revenue leak: delayed follow-up</li>
            </ul>
          </div>

          <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 24 }}>
            <Button variant="secondary" onClick={() => toast.success("Error report downloaded")}>
              ⤓ Download error report
            </Button>
            <Button variant="primary" size="lg" onClick={() => navigate("/app/radar")}>
              View your Revenue Radar →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function Steps({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "mapping", label: "Map columns" },
    { id: "validate", label: "Validate" },
    { id: "importing", label: "Import" },
    { id: "done", label: "Done" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === current);
  return (
    <div className="row" style={{ gap: 6, marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
      {steps.map((s, i) => (
        <div key={s.id} className="row" style={{ gap: 6 }}>
          <span
            className="badge"
            style={{
              background: i <= activeIndex ? "var(--color-primary)" : "var(--color-neutral-soft)",
              color: i <= activeIndex ? "#fff" : "var(--color-muted)",
              borderColor: "transparent",
            }}
          >
            {i + 1}. {s.label}
          </span>
          {i < steps.length - 1 && <span className="muted">→</span>}
        </div>
      ))}
    </div>
  );
}
