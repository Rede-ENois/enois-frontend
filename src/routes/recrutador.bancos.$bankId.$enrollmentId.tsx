import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { TalentBankCandidateDetail } from "@rede-enois/design-system/domain";
import { Button, EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";

import { talentBanksApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { paraFicha } from "@/lib/talent-banks/view-models";

import { AppContainer } from "@/components/app-container";

/**
 * A ficha de uma pessoa inscrita: só o que ela autorizou, campo por campo.
 *
 * O currículo vem do backend com a autorização conferida no servidor — o app baixa o arquivo
 * autorizado e nunca exõe um endereço público do storage.
 */
export const Route = createFileRoute("/recrutador/bancos/$bankId/$enrollmentId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.talentBanks.seoTitle }] }),
  component: FichaDoInscritoPage,
});

function FichaDoInscritoPage() {
  const { bankId, enrollmentId } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [erro, setErro] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  const ficha = useQuery({
    queryKey: ["talent-bank-candidate", bankId, enrollmentId],
    queryFn: () => talentBanksApi.candidate(bankId, enrollmentId),
    retry: false,
  });

  const encerrar = useMutation({
    mutationFn: () => talentBanksApi.closeEnrollment(bankId, enrollmentId),
    onSuccess: () => {
      toast(texts.talentBanks.closeDone, "success");
      void queryClient.invalidateQueries({
        queryKey: ["talent-bank-candidate", bankId, enrollmentId],
      });
      void queryClient.invalidateQueries({ queryKey: ["talent-bank-candidates"] });
    },
    onError: () => {
      setErro(texts.talentBanks.closeError);
    },
  });

  const baixar = async () => {
    setErro(null);
    setBaixando(true);

    try {
      const arquivo = await talentBanksApi.resume(bankId, enrollmentId);
      const endereco = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = endereco;
      link.download = ficha.data?.resumeName ?? "curriculo.pdf";
      link.click();
      URL.revokeObjectURL(endereco);
    } catch {
      setErro(texts.talentBanks.resumeError);
    } finally {
      setBaixando(false);
    }
  };

  if (ficha.isLoading) {
    return (
      <AppContainer>
        <LoadingState label={texts.common.loading} />
      </AppContainer>
    );
  }

  if (!ficha.data) {
    return (
      <AppContainer>
        <EmptyState
          title={texts.talentBanks.candidateError}
          description={texts.talentBanks.recruiterSubtitle}
        >
          <Button variant="outline" onClick={() => void ficha.refetch()}>
            {texts.talentBanks.retry}
          </Button>
        </EmptyState>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <TalentBankCandidateDetail
        candidate={paraFicha(ficha.data)}
        onDownloadResume={() => void baixar()}
        onClose={() => {
          setErro(null);
          void encerrar.mutateAsync();
        }}
        pending={encerrar.isPending || baixando}
        error={erro}
      />
    </AppContainer>
  );
}
