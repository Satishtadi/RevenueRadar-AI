interface Props {
  score: number;
  size?: number;
  label?: string;
}

export function ScoreRing({ score, size = 76, label = "Recovery" }: Props) {
  const stroke = Math.max(6, size / 10);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = score >= 80 ? "var(--color-risk)" : score >= 60 ? "var(--color-warning)" : "var(--color-info)";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} role="img" aria-label={`${label} score ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          flexDirection: "column",
        }}
      >
        <span style={{ fontSize: size / 3.4, fontWeight: 750, lineHeight: 1, color }}>{score}</span>
        <span style={{ fontSize: size / 8, color: "var(--color-muted)", lineHeight: 1.2 }}>/100</span>
      </div>
    </div>
  );
}
