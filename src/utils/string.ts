export function formatEnumValue(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}

export function formatEnumLabel(value: string): string {
  const formattedValue = formatEnumValue(value);
  return formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1);
}
