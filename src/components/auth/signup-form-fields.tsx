import { texts } from "@/texts";
import type { SignupFormFieldsProps } from "@/types/components/auth/signup-form-fields-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";

export function SignupFormFields({ errors }: SignupFormFieldsProps) {
  const fields = [
    {
      key: "name",
      label: texts.auth.fields.fullName,
      error: errors.name,
      control: (
        <Input
          name="name"
          placeholder={texts.auth.placeholders.name}
          autoComplete="name"
          required
          maxLength={80}
        />
      ),
    },
    {
      key: "email",
      label: texts.auth.fields.email,
      error: errors.email,
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
      control: (
        <AuthPasswordInput
          name="password"
          placeholder={texts.auth.placeholders.newPassword}
          autoComplete="new-password"
          required
          maxLength={128}
        />
      ),
    },
  ];

  return (
    <>
      {fields.map((field) => (
        <FormField key={field.key} label={field.label} error={field.error}>
          {field.control}
        </FormField>
      ))}
    </>
  );
}
