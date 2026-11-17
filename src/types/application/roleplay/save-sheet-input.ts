export type SaveSheetInput = {
  name: string;
  entries: { key: string; value: string; visibility?: string }[];
};
