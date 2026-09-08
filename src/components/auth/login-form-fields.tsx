import { texts } from "@/texts";
import type { LoginFormFieldsProps } from "@/types/components/auth/login-form-fields-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";

export function LoginFormFields({ errors, onForgot }: LoginFormFieldsProps) {
  const fields = [
    {
      key: "email",
      label: texts.auth.fields.email,
      error: errors.email,
      right: undefined,
      control: (
        <Input
          name="email"
          type="email"
          placeholder={texts.auth.placeholders.email}
          autoComplete="email"
          required
          maxLength={255}
        />
      ),
    },
    {
      key: "password",
      label: texts.auth.fields.password,
      error: errors.password,
      right: (
        <button
          type="button"
          onClick={onForgot}
          className="text-xs font-medium text-primary hover:underline"
        >
          {texts.auth.password.forgot}
        </button>
      ),
      control: (
        <AuthPasswordInput
          name="password"
          placeholder={texts.auth.placeholders.password}
          autoComplete="current-password"
          required
          maxLength={128}
        />
      ),
    },
  ];

  return (
    <>
      {fields.map((field) => (
        <FormField key={field.key} label={field.label} error={field.error} right={field.right}>
          {field.control}
        </FormField>
      ))}
    </>
  );
}
