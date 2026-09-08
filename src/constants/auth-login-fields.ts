import { texts } from "@/texts";

export const AUTH_LOGIN_FIELDS = [
  {
    key: "email",
    label: texts.auth.fields.email,
    control: "input",
    right: null,
    inputProps: {
      name: "email",
      type: "email",
      placeholder: texts.auth.placeholders.email,
      autoComplete: "email",
      required: true,
      maxLength: 255,
    },
  },
  {
    key: "password",
    label: texts.auth.fields.password,
    control: "password",
    right: "forgot-password",
    inputProps: {
      name: "password",
      placeholder: texts.auth.placeholders.password,
      autoComplete: "current-password",
      required: true,
      maxLength: 128,
    },
  },
] as const;
