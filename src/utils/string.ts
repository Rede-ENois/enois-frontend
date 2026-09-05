export function humanizeEnum(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}

export function humanizeEnumLabel(value: string): string {
  const humanized = humanizeEnum(value);
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}
