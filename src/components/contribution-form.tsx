import { texts } from "@/texts";
import type { ContributionFormProps } from "@/types/components/contribution-form-props";
import {
  type ContributionFormValues,
  ContributionForm as ContributionFormView,
} from "@rede-enois/design-system/domain";

import { ApiError, contributorsApi } from "@/lib/api";

/**
 * Formulário público de contribuição. A landing é aberta, então ele não pede conta: grava a
 * candidatura e o aceite dos termos para a fila interna de documentação do projeto.
 */
export function ContributionForm({
  mode = "landing",
  initial,
  onSuccess,
}: ContributionFormProps = {}) {
  const submit = async (values: ContributionFormValues): Promise<string | null> => {
    const payload = {
      name: values.name.trim(),
      github: values.github.trim(),
      email: values.email.trim(),
      area: values.area || undefined,
      experience: values.experience || undefined,
      message: values.message.trim() || undefined,
      acceptedTerms: values.acceptedTerms,
    };
    try {
      if (mode === "verified") {
        await contributorsApi.applyVerified(payload);
      } else {
        await contributorsApi.apply(payload);
      }
      onSuccess?.();
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : texts.landing.contribute.error;
    }
  };

  return (
    <ContributionFormView termsHref="/termos" onSubmit={submit} mode={mode} initial={initial} />
  );
}
