export type RelativeTimeRule = {
  matches: (minutes: number) => boolean;
  format: (minutes: number) => string;
};
