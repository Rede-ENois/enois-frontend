import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export function createSubListFormValues<T extends Record<"id", string>>(
  item: T,
  fields: SubField[],
): Record<string, string> {
  const values = item as Record<string, unknown>;
  return Object.fromEntries(fields.map((field) => [field.key, String(values[field.key] ?? "")]));
}
