import { AUTH_SIGNUP_FIELDS } from "@/constants/auth-signup-fields";
import type { SignupFormFieldsProps } from "@/types/components/auth/signup-form-fields-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";

export function SignupFormFields({ errors }: SignupFormFieldsProps) {
  return (
    <>
      {AUTH_SIGNUP_FIELDS.map((field) => (
        <FormField key={field.key} label={field.label} error={errors[field.key]}>
          {field.control === "password" ? (
            <AuthPasswordInput {...field.inputProps} />
          ) : (
            <Input {...field.inputProps} />
          )}
        </FormField>
      ))}
    </>
  );
}
