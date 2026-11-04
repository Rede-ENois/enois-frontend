/** One line of the feed scroll report: what moved, by how much, and when (ms since page load). */
export type ScrollDebugEntry =
  | {
      t: number;
      kind: "resize";
      index: number;
      post: string;
      from: number;
      to: number;
      scrollY: number;
      scrollAfter: number;
    }
  | { t: number; kind: "jump"; from: number; to: number }
  | { t: number; kind: "list"; count: number; first: string; margin: number };
