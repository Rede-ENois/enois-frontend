import { legalPrivacyTexts } from "@/texts/legal-privacy";
import { legalSharedTexts } from "@/texts/legal-shared";
import { legalTermsTexts } from "@/texts/legal-terms";

export const legalTexts = {
  ...legalSharedTexts,
  terms: legalTermsTexts,
  privacy: legalPrivacyTexts,
} as const;
