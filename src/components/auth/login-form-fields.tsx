import { AUTH_LOGIN_FIELDS } from "@/constants/auth-login-fields";
import type { LoginFormFieldsProps } from "@/types/components/auth/login-form-fields-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";
import { ForgotPasswordDialog } from "./forgot-password-dialog";

export function LoginFormFields({ errors }: LoginFormFieldsProps) {
  return (
    <>
      {AUTH_LOGIN_FIELDS.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          error={errors[field.key]}
          right={field.right === "forgot-password" ? <ForgotPasswordDialog /> : undefined}
        >
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
