import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type AgeGateMode, AgeGate as AgeGateView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { BIRTH_DATE_REQUIRED_EVENT, PARENTAL_CONSENT_REQUIRED_EVENT } from "@/lib/age-required";
import { parentalApi, profileApi } from "@/lib/api";
import { anoAtual } from "@/lib/date/format";
import { hasSession } from "@/lib/require-auth";

/**
 * Política de idade do ECA Digital, em um diálogo só.
 *
 * - Sem data de nascimento: pede a data (a conta é regularizada na hora).
 * - Menor sem responsável: pede o e-mail do responsável e envia o convite; a conta continua
 *   bloqueada para escrever até um adulto aceitar (o backend é quem decide).
 * - Qualquer 403 desses códigos abre o diálogo na tela onde a pessoa tentou agir.
 */
export function AgeGate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AgeGateMode>("date");
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const ageState = useQuery({
    queryKey: ["profile", "age-state"],
    queryFn: () => profileApi.ageState(),
    enabled: hydrated && hasSession(),
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const state = ageState.data?.state;
    if (state === "BIRTH_DATE_REQUIRED") {
      setMode("date");
      setOpen(true);
    } else if (state === "MINOR_CONSENT_PENDING") {
      setMode("parental");
      setOpen(true);
    } else if (state === "ADULT_DECLARED" || state === "MINOR_SUPERVISED") {
      setInviteSentTo(null);
      setOpen(false);
    }
  }, [ageState.data?.state]);

  useEffect(() => {
    const openDate = () => {
      setMode("date");
      setOpen(true);
    };
    const openParental = () => {
      setMode("parental");
      setOpen(true);
    };
    window.addEventListener(BIRTH_DATE_REQUIRED_EVENT, openDate);
    window.addEventListener(PARENTAL_CONSENT_REQUIRED_EVENT, openParental);
    return () => {
      window.removeEventListener(BIRTH_DATE_REQUIRED_EVENT, openDate);
      window.removeEventListener(PARENTAL_CONSENT_REQUIRED_EVENT, openParental);
    };
  }, []);

  const declare = useMutation({
    mutationFn: (birthDate: string) => profileApi.declareBirthDate(birthDate),
    onSuccess: (state) => {
      queryClient.setQueryData(["profile", "age-state"], state);
      setError(null);
      toast(state.minor ? texts.ageGate.savedMinor : texts.ageGate.saved, "success");
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.ageGate.error),
  });

  const invite = useMutation({
    mutationFn: (guardianEmail: string) => parentalApi.invite(guardianEmail),
    onSuccess: (view, guardianEmail) => {
      setInviteSentTo(guardianEmail);
      setError(null);
      toast(
        view.emailSent ? texts.parentalGate.sent : texts.parentalGate.emailFailed,
        view.emailSent ? "success" : "error",
      );
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.parentalGate.error),
  });

  const today = new Date().toISOString().slice(0, 10);
  const oldest = `${anoAtual() - 120}-01-01`;

  return (
    <AgeGateView
      open={open}
      onClose={() => setOpen(false)}
      mode={mode}
      minDate={oldest}
      maxDate={today}
      inviteSentTo={inviteSentTo}
      error={error}
      declaring={declare.isPending}
      inviting={invite.isPending}
      checking={ageState.isFetching}
      onSubmitDate={(birthDate) => {
        setError(null);
        declare.mutate(birthDate);
      }}
      onSubmitInvite={(guardianEmail) => {
        setError(null);
        invite.mutate(guardianEmail);
      }}
      onCheckAgain={() => {
        setError(null);
        void ageState.refetch();
      }}
    />
  );
}
