import { texts } from "@/texts";

export const AUTH_SIGNUP_FIELDS = [
  {
    key: "name",
    label: texts.auth.fields.fullName,
    control: "input",
    inputProps: {
      name: "name",
      placeholder: texts.auth.placeholders.name,
      autoComplete: "name",
      required: true,
      maxLength: 80,
    },
  },
  {
    key: "email",
    label: texts.auth.fields.email,
    control: "input",
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
    inputProps: {
      name: "password",
      placeholder: texts.auth.placeholders.newPassword,
      autoComplete: "new-password",
      required: true,
      maxLength: 128,
    },
  },
] as const;
