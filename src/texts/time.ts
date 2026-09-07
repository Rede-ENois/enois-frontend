export const timeTexts = {
  now: "agora",
  minutesAgo: (minutes: number) => `há ${minutes} min`,
  hoursAgo: (hours: number) => `há ${hours} h`,
  daysAgo: (days: number) => `há ${days} ${days === 1 ? "dia" : "dias"}`,
} as const;
