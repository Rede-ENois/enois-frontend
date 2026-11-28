import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { TalentBankCandidateList, TalentBankEditor } from "@rede-enois/design-system/domain";
import type {
  TalentBankCandidateFilters,
  TalentBankCandidateListState,
  TalentBankEditorValues,
} from "@rede-enois/design-system/domain";
import { EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";

import { ApiError, talentBanksApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { requireAuth } from "@/lib/require-auth";
import { paraCandidato } from "@/lib/talent-banks/view-models";

import { AppContainer } from "@/components/app-container";
import { RecruiterModeSwitch } from "@/components/profile/recruiter-mode-switch";

/**
 * O painel do recrutador: o banco dele e as pessoas que se inscreveram.
 *
 * O acesso depende do modo recrutador ligado no perfil — sem ele, o backend recusa tudo, e a
 * tela avisa antes de tentar. Cada recrutador só enxerga o próprio banco: a lista vem do backend
 * já filtrada pelo dono.
 */
export const Route = createFileRoute("/recrutador/bancos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.talentBanks.seoTitle }] }),
  component: RecrutadorBancosPage,
});

const FILTROS_VAZIOS: TalentBankCandidateFilters = {
  search: "",
  state: "",
  skill: "",
  minExperiences: "",
  education: "",
};

const VALORES_VAZIOS: TalentBankEditorValues = {
  title: "",
  purpose: "",
  description: "",
  handlingConditions: "",
  focusArea: "",
  desiredSkills: "",
  requestedFields: [],
};

function RecrutadorBancosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const recrutador = me?.isRecruiter === true;

  const [values, setValues] = useState<TalentBankEditorValues>(VALORES_VAZIOS);
  const [filtros, setFiltros] = useState<TalentBankCandidateFilters>(FILTROS_VAZIOS);
  const [erro, setErro] = useState<string | null>(null);

  const bank = useQuery({
    queryKey: ["talent-bank-owned"],
    queryFn: () => talentBanksApi.owned(),
    enabled: recrutador,
    retry: false,
  });

  // A banca que não existe responde 404 — é o "ainda não crio", não uma falha.
  const semBanca = bank.isError && bank.error instanceof ApiError && bank.error.status === 404;
  const meuBanco = semBanca ? null : bank.data;

  useEffect(() => {
    if (!meuBanco) return;

    setValues({
      title: meuBanco.title,
      purpose: meuBanco.purpose,
      description: meuBanco.description ?? "",
      handlingConditions: meuBanco.handlingConditions,
      focusArea: meuBanco.focusArea ?? "",
      desiredSkills: meuBanco.desiredSkills.join(", "),
      requestedFields: meuBanco.requestedFields,
    });
  }, [meuBanco]);

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["talent-bank-owned"] });
    void queryClient.invalidateQueries({ queryKey: ["talent-banks"] });
    void queryClient.invalidateQueries({ queryKey: ["talent-bank-candidates"] });
  };

  const salvar = useMutation({
    mutationFn: () => {
      const entrada = {
        title: values.title.trim(),
        purpose: values.purpose.trim(),
        description: values.description.trim(),
        handlingConditions: values.handlingConditions.trim(),
        focusArea: values.focusArea.trim(),
        desiredSkills: values.desiredSkills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        requestedFields: values.requestedFields,
      };

      return meuBanco
        ? talentBanksApi.update(meuBanco.id, entrada)
        : talentBanksApi.create(entrada);
    },
    onSuccess: () => {
      toast(meuBanco ? texts.talentBanks.saveDone : texts.talentBanks.createDone, "success");
      invalidar();
    },
    onError: () => {
      setErro(texts.talentBanks.saveError);
    },
  });

  const visibilidade = useMutation({
    mutationFn: (visivel: boolean) => talentBanksApi.setVisibility(meuBanco!.id, visivel),
    onSuccess: () => {
      toast(texts.talentBanks.visibilityDone, "success");
      invalidar();
    },
    onError: () => {
      setErro(texts.talentBanks.saveError);
    },
  });

  const minExperiences = filtros.minExperiences ? Number(filtros.minExperiences) : undefined;

  const inscritos = useInfiniteQuery({
    queryKey: [
      "talent-bank-candidates",
      meuBanco?.id,
      filtros.search,
      filtros.state,
      filtros.skill,
      minExperiences,
      filtros.education,
    ],
    queryFn: ({ pageParam }) =>
      talentBanksApi.candidates(meuBanco!.id, {
        cursor: pageParam,
        search: filtros.search,
        state: filtros.state,
        skill: filtros.skill,
        minExperiences,
        education: filtros.education,
        limit: 24,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: recrutador && !!meuBanco,
  });

  const items = inscritos.data?.pages.flatMap((page) => page.items) ?? [];
  const ultimo = inscritos.data?.pages.at(-1);

  const estadoLista: TalentBankCandidateListState = inscritos.isLoading
    ? { kind: "loading" }
    : inscritos.isError
      ? { kind: "error" }
      : { kind: "ready" };

  if (!me) {
    return (
      <AppContainer>
        <LoadingState label={texts.common.loading} />
      </AppContainer>
    );
  }

  if (!recrutador) {
    return (
      <AppContainer>
        <EmptyState
          title={texts.talentBanks.recruiterTitle}
          description={texts.talentBanks.recruiterModeOff}
        >
          {/* O interruptor aqui, e não um desvio para o perfil: a frase manda ativar o modo, então
              o botão que ativa fica do lado dela. */}
          <RecruiterModeSwitch />
        </EmptyState>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {bank.isLoading && <LoadingState label={texts.common.loading} />}

      {(meuBanco || semBanca) && (
        <TalentBankEditor
          values={values}
          onChange={setValues}
          discoverable={meuBanco?.discoverable ?? false}
          onDiscoverableChange={(descobrir) => {
            if (!meuBanco) return;

            visibilidade.mutate(descobrir);
          }}
          onSave={() => {
            setErro(null);
            void salvar.mutateAsync();
          }}
          createdAt={meuBanco?.createdAt ?? null}
          pending={salvar.isPending || visibilidade.isPending}
          error={erro}
        />
      )}

      {meuBanco && (
        <TalentBankCandidateList
          candidates={items.map(paraCandidato)}
          filters={filtros}
          onFiltersChange={setFiltros}
          activeTotal={ultimo?.activeTotal ?? 0}
          pendingTotal={ultimo?.pendingTotal ?? 0}
          hasMore={inscritos.hasNextPage}
          onLoadMore={() => void inscritos.fetchNextPage()}
          onOpenCandidate={(enrollmentId) =>
            void navigate({
              to: "/recrutador/bancos/$bankId/$enrollmentId",
              params: { bankId: meuBanco.id, enrollmentId },
            })
          }
          state={estadoLista}
          onRetry={() => void inscritos.refetch()}
        />
      )}
    </AppContainer>
  );
}
