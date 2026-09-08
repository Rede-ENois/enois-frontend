import { AUTH_SIGNUP_FIELDS } from "@/constants/auth/auth-signup-fields";
import { useSignupFormContext } from "@/utils/auth/use-signup-form-context";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";

export function SignupFormFields() {
  const { errors } = useSignupFormContext();

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
