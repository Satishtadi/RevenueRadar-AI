const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function formatMoney(amount: number, currency = "INR"): string {
  const symbol = SYMBOLS[currency] ?? "";
  if (currency === "INR") {
    return `${symbol}${formatIndianNumber(Math.round(amount))}`;
  }
  return `${symbol}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatIndianNumber(n: number): string {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

export function compactMoney(amount: number, currency = "INR"): string {
  if (amount >= 10000000) return `${formatMoney(amount / 10000000, currency).replace(/\.0+$/, "")}Cr`;
  if (amount >= 100000) return `${formatMoney(amount / 100000, currency).replace(/\.0+$/, "")}L`;
  if (amount >= 1000) return `${formatMoney(amount / 1000, currency).replace(/\.0+$/, "")}K`;
  return formatMoney(amount, currency);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value?: string | null): string {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function daysSince(value?: string | null): number {
  if (!value) return 999;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export function isToday(value: string): boolean {
  const d = new Date(value);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export function isOverdue(value: string): boolean {
  return new Date(value).getTime() < Date.now() && !isToday(value);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
