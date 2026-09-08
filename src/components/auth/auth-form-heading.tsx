import type { AuthFormHeadingProps } from "@/types/components/auth/auth-form-heading-props";

export function AuthFormHeading({ title, subtitle }: AuthFormHeadingProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </>
  );
}
