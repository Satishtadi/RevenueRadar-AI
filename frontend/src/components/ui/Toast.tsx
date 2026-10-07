import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  push: (message: string, tone?: ToastTone) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, tone, message }]);
      window.setTimeout(() => remove(id), 3600);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({ push, success: (m) => push(m, "success"), error: (m) => push(m, "error") }),
    [push]
  );

  const tones: Record<ToastTone, { bg: string; fg: string; border: string }> = {
    success: { bg: "var(--color-success-soft)", fg: "#15803d", border: "var(--color-success-border)" },
    error: { bg: "var(--color-risk-soft)", fg: "var(--color-risk)", border: "var(--color-risk-border)" },
    info: { bg: "var(--color-info-soft)", fg: "var(--color-info)", border: "var(--color-info-border)" },
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 360,
        }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-in"
            role="status"
            style={{
              background: tones[t.tone].bg,
              color: tones[t.tone].fg,
              border: `1px solid ${tones[t.tone].border}`,
              borderRadius: "var(--radius-md)",
              padding: "11px 14px",
              fontSize: "var(--text-base)",
              fontWeight: 550,
              boxShadow: "var(--shadow-md)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
