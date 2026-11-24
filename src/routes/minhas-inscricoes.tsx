import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { TalentBankMyEnrollments } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { talentBanksApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { paraMinhaInscricao } from "@/lib/talent-banks/view-models";

import { AppContainer } from "@/components/app-container";

/**
 * As inscrições da própria pessoa: onde ela entrou, o que autorizou e como retirar.
 *
 * A revogação corta o acesso na hora; o pedido de exclusão apaga os dados e mantém só o registro
 * do consentimento. As duas coisas são pedidos da pessoa, nunca do recrutador.
 */
export const Route = createFileRoute("/minhas-inscricoes")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.talentBanks.seoTitle }] }),
  component: MinhasInscricoesPage,
});

function MinhasInscricoesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const mine = useQuery({
    queryKey: ["talent-bank-enrollments"],
    queryFn: () => talentBanksApi.mine(),
  });

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["talent-bank-enrollments"] });
    void queryClient.invalidateQueries({ queryKey: ["talent-bank"] });
  };

  const revogar = useMutation({
    mutationFn: ({ bankId, enrollmentId }: { bankId: string; enrollmentId: string }) =>
      talentBanksApi.revokeEnrollment(bankId, enrollmentId),
    onSuccess: () => {
      toast(texts.talentBanks.revokeDone, "success");
      invalidar();
    },
    onError: () => {
      setErro(texts.talentBanks.revokeError);
    },
    onSettled: () => setOcupado(null),
  });

  const apagar = useMutation({
    mutationFn: ({ bankId, enrollmentId }: { bankId: string; enrollmentId: string }) =>
      talentBanksApi.eraseEnrollment(bankId, enrollmentId),
    onSuccess: () => {
      toast(texts.talentBanks.eraseDone, "success");
      invalidar();
    },
    onError: () => {
      setErro(texts.talentBanks.eraseError);
    },
    onSettled: () => setOcupado(null),
  });

  return (
    <AppContainer>
      <TalentBankMyEnrollments
        enrollments={(mine.data ?? []).map(paraMinhaInscricao)}
        onOpen={(enrollmentId) => {
          const inscricao = mine.data?.find((item) => item.enrollmentId === enrollmentId);

          if (inscricao) {
            void navigate({
              to: "/bancos-de-talentos/$bankId",
              params: { bankId: inscricao.bankId },
            });
          }
        }}
        onRevoke={(enrollmentId) => {
          const inscricao = mine.data?.find((item) => item.enrollmentId === enrollmentId);

          if (!inscricao) return;

          setErro(null);
          setOcupado(enrollmentId);
          void revogar.mutateAsync({ bankId: inscricao.bankId, enrollmentId });
        }}
        onErase={(enrollmentId) => {
          const inscricao = mine.data?.find((item) => item.enrollmentId === enrollmentId);

          if (!inscricao) return;

          setErro(null);
          setOcupado(enrollmentId);
          void apagar.mutateAsync({ bankId: inscricao.bankId, enrollmentId });
        }}
        busyEnrollmentId={ocupado}
        error={erro ?? (mine.isError ? texts.talentBanks.myEnrollmentsError : null)}
      />
    </AppContainer>
  );
}
