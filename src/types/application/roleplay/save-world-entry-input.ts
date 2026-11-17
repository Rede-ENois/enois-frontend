export type SaveWorldEntryInput = {
  kind: string;
  title: string;
  body?: string | null;
  tags?: string[];
  sheetId?: string | null;
};
