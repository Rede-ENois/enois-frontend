import type { TwoFactorStatus } from "@/types/application/auth/two-factor-status";

export type SectionProps = {
  status: TwoFactorStatus;
  onError: (err: unknown, fallback: string) => void;
  onDone: () => void;
};
