type JobFilterGroupProps = {
  label: string;
  values: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  getLabel?: (value: string) => string;
};

export function JobFilterGroup({ label, values, selected, onChange, getLabel = (value) => value }: JobFilterGroupProps) {
  return <div className="mt-3 flex flex-wrap gap-2 first:mt-4"><div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>{values.map((value) => <button key={value} type="button" onClick={() => onChange(selected === value ? "" : value)} className={`rounded-full border px-3 py-1 text-xs transition ${selected === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{getLabel(value)}</button>)}</div></div>;
}
