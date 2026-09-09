export const APP_BRAND_VARIANTS = {
  app: {
    to: "/feed",
    rootClassName: "flex shrink-0 items-center gap-2",
    iconClassName:
      "grid h-8 w-8 place-items-center rounded-xl text-primary-foreground sm:h-9 sm:w-9",
    glyphClassName: "h-4 w-4",
    labelClassName: "text-lg font-semibold tracking-tight",
    style: { background: "var(--gradient-primary)" },
  },
  "auth-desktop": {
    to: "/",
    rootClassName: "relative flex items-center gap-2",
    iconClassName:
      "grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 backdrop-blur",
    glyphClassName: "h-4 w-4",
    labelClassName: "text-lg font-semibold tracking-tight",
    style: undefined,
  },
  "auth-mobile": {
    to: "/",
    rootClassName: "flex items-center gap-2",
    iconClassName: "grid h-9 w-9 place-items-center rounded-xl text-primary-foreground",
    glyphClassName: "h-4 w-4",
    labelClassName: "font-semibold tracking-tight",
    style: { background: "var(--gradient-primary)" },
  },
  public: {
    to: "/",
    rootClassName: "flex items-center gap-2",
    iconClassName: "grid h-8 w-8 place-items-center rounded-lg text-primary-foreground",
    glyphClassName: "h-3.5 w-3.5",
    labelClassName: "text-base font-semibold tracking-tight",
    style: { background: "var(--gradient-primary)" },
  },
} as const;
