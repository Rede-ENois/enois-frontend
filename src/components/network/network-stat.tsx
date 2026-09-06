type NetworkStatProps = {
  label: string;
  value: string;
  isHighlighted?: boolean;
};

export function NetworkStat({ label, value, isHighlighted }: NetworkStatProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isHighlighted ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"
      }`}
    >
      <p className={`text-2xl font-semibold ${isHighlighted ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
