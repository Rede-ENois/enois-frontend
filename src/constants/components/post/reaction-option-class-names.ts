export const REACTION_OPTION_CLASS_NAMES = {
  post: {
    base: "text-xl hover:bg-muted",
    selected: "bg-muted ring-1 ring-primary",
  },
  comment: {
    base: "text-lg hover:bg-surface-2",
    selected: "bg-surface-2 ring-1 ring-primary",
  },
} as const;
