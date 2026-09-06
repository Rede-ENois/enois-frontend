export type ProfileSubField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
};

export type ProfileSubListProps<T extends { id: string }, TInput extends object> = {
  items: T[];
  fields: ProfileSubField[];
  currentlyHereKey?: string;
  createApi: (input: TInput) => Promise<T>;
  updateApi: (itemId: string, input: TInput) => Promise<T>;
  removeApi: (itemId: string) => Promise<void>;
  queryKey: readonly unknown[];
  emptyMessage: string;
  newItem: Record<string, string>;
};
