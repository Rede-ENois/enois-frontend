export type ProfileEntryField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
};

export type ProfileEntryListProps<T extends { id: string }, TInput extends object> = {
  entries: T[];
  fields: ProfileEntryField[];
  currentlyHereKey?: string;
  createEntry: (input: TInput) => Promise<T>;
  updateEntry: (entryId: string, input: TInput) => Promise<T>;
  removeEntry: (entryId: string) => Promise<void>;
  queryKey: readonly unknown[];
  emptyMessage: string;
  newEntry: Record<string, string>;
};
