import type { ChangelogItem } from "./changelog-item";

export type ChangelogRelease = {
  version: string;
  date: string;
  title: string;
  description: string;
  items: ChangelogItem[];
};
