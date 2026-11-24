import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { TalentBankConsent, useTalentBankSharedFields } from "@rede-enois/design-system/domain";
import { Button, EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";

import { talentBanksApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { paraDetalhe, paraInscricaoDaPessoa } from "@/lib/talent-banks/view-models";

import { AppContainer } from "@/components/app-container";

/**
 * A banca aberta e o consentimento: quem publica, para quê, com quais condições e o que será
 * compartilhado. Nada é compartilhado antes da confirmação — e a pessoa pode revogar ou pedir a
 * exclusão na mesma tela.
 */
export const Route = createFileRoute("/bancos-de-talentos/$bankId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.talentBanks.seoTitle }] }),
  component: BancaPage,
});

function BancaPage() {
  const { bankId } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const options = useTalentBankSharedFields();

  const [step, setStep] = useState<"details" | "authorize">("details");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bank = useQuery({
    queryKey: ["talent-bank", bankId],
    queryFn: () => talentBanksApi.detail(bankId),
  });

  const mine = useQuery({
    queryKey: ["talent-bank-enrollments"],
    queryFn: () => talentBanksApi.mine(),
  });

  const enrollment = mine.data?.find((item) => item.bankId === bankId) ?? null;

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["talent-bank", bankId] });
    void queryClient.invalidateQueries({ queryKey: ["talent-bank-enrollments"] });
    void queryClient.invalidateQueries({ queryKey: ["talent-banks"] });
  };

  const inscrever = useMutation({
    mutationFn: async () => {
      const pedido = await talentBanksApi.requestEnrollment(bankId, {
        sharedFields: selectedFields,
        note: note.trim() ? note.trim() : null,
      });

      return talentBanksApi.confirmEnrollment(bankId, pedido.id);
    },
    onSuccess: () => {
      toast(texts.talentBanks.enrollSuccess, "success");
      setStep("details");
      setSelectedFields([]);
      setNote("");
      invalidar();
    },
    onError: () => {
      setError(texts.talentBanks.enrollError);
    },
  });

  const revogar = useMutation({
    mutationFn: () => talentBanksApi.revokeEnrollment(bankId, enrollment!.enrollmentId),
    onSuccess: () => {
      toast(texts.talentBanks.revokeDone, "success");
      invalidar();
    },
    onError: () => {
      setError(texts.talentBanks.revokeError);
    },
  });

  const apagar = useMutation({
    mutationFn: () => talentBanksApi.eraseEnrollment(bankId, enrollment!.enrollmentId),
    onSuccess: () => {
      toast(texts.talentBanks.eraseDone, "success");
      invalidar();
    },
    onError: () => {
      setError(texts.talentBanks.eraseError);
    },
  });

  if (bank.isError) {
    return (
      <AppContainer>
        <EmptyState
          title={texts.talentBanks.bankError}
          description={texts.talentBanks.showcaseSubtitle}
        >
          <Button variant="outline" onClick={() => void bank.refetch()}>
            {texts.talentBanks.retry}
          </Button>
        </EmptyState>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {bank.isLoading && <LoadingState label={texts.common.loading} />}

      {bank.data && (
        <TalentBankConsent
          bank={paraDetalhe(bank.data, options)}
          selectedFields={selectedFields}
          onToggleField={(key) =>
            setSelectedFields((atuais) =>
              atuais.includes(key) ? atuais.filter((item) => item !== key) : [...atuais, key],
            )
          }
          note={note}
          onNoteChange={setNote}
          step={step}
          enrollment={enrollment ? paraInscricaoDaPessoa(enrollment) : null}
          onStart={() => {
            setError(null);
            setStep("authorize");
          }}
          onConfirm={() => {
            setError(null);
            void inscrever.mutateAsync();
          }}
          onBack={() => setStep("details")}
          onRevoke={() => {
            setError(null);
            void revogar.mutateAsync();
          }}
          onErase={() => {
            setError(null);
            void apagar.mutateAsync();
          }}
          pending={inscrever.isPending || revogar.isPending || apagar.isPending}
          error={error}
        />
      )}
    </AppContainer>
  );
}
