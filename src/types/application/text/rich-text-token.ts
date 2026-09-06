export type RichTextToken =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; username: string }
  | { type: "url"; value: string };
