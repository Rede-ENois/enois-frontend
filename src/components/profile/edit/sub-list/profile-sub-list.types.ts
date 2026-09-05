export type ProfileSubField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
};

export type ProfileSubListProps<T extends { id: string }, TData extends object> = {
  items: T[];
  fields: ProfileSubField[];
  currentlyHereKey?: string;
  createApi: (data: TData) => Promise<T>;
  updateApi: (id: string, data: TData) => Promise<T>;
  deleteApi: (id: string) => Promise<void>;
  queryKey: readonly unknown[];
  emptyMessage: string;
  newItem: Record<string, string>;
};
