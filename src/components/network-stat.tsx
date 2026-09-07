import type { StatProps } from "@/types/components/network/stat-props";

export function Stat({ label, value, highlight }: StatProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"
      }`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>

      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
