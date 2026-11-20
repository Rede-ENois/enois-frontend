import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { POST_TOPICS } from "@/constants/community-topics";
import { texts } from "@/texts";
import {
  type StudyPairIcebreakerAnswers,
  StudyPairProposals,
  type StudyPairRequestInput,
  type StudyPairSaveStatus,
  type StudyPairsErrorCode,
  StudyPairsView,
} from "@rede-enois/design-system/domain";
import { Button, PillRow, useToast } from "@rede-enois/design-system/ui";

import { ApiError, messagesApi, studyPairsApi } from "@/lib/api";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { toIcebreakerField, toStudyPairProposal } from "@/lib/study-pairs/proposal";
import { studyPairsErrorCode, toStudyPair, topicLabel } from "@/lib/study-pairs/to-study-pair";
import { useReenableModule } from "@/lib/use-personalization";

import { GoalSearch } from "./goal-search";

const ME_KEY = ["study-pairs", "me"] as const;
const POPULAR_KEY = ["study-pairs", "popular"] as const;

const TOPIC_OPTIONS = POST_TOPICS.map((topic) => ({
  value: topic,
  label: topicLabel(topic) ?? topic,
}));

/** /par-de-estudo: own pairs, the open request and the request form. */
export function StudyPairs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [requestError, setRequestError] = useState<StudyPairsErrorCode | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<Record<string, StudyPairSaveStatus>>({});
  const [proposalError, setProposalError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const me = useQuery({ queryKey: ME_KEY, queryFn: () => studyPairsApi.me() });
  // Chips are a nice-to-have: a failure just hides them.
  const popular = useQuery({ queryKey: POPULAR_KEY, queryFn: () => studyPairsApi.popularGoals() });

  const navigate = useNavigate();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["study-pairs"] });

  const request = useMutation({
    mutationFn: ({ goal, topic }: StudyPairRequestInput) =>
      studyPairsApi.request(goal.trim(), topic),
    onMutate: () => setRequestError(null),
    onSuccess: (result) => {
      if (result.status === "MATCHED") toast(texts.studyPairs.matched, "success");
      void refresh();
    },
    onError: (error) => setRequestError(studyPairsErrorCode(error)),
  });

  // The module was turned off elsewhere (another tab): the form offers to turn it back on. Nothing
  // is retried; the person sends the request again.
  const reenable = useReenableModule();
  const turnModuleOn = () =>
    reenable.mutate("STUDY_PAIRS", {
      onSuccess: () => setRequestError(null),
      onError: () => toast(texts.studyPairs.reenableError, "error"),
    });

  const cancelRequest = useMutation({
    mutationFn: () => studyPairsApi.cancelRequest(),
    onSuccess: () => void refresh(),
    onError: () => toast(texts.studyPairs.cancelError, "error"),
  });

  const setStatus = (pairId: string, status: StudyPairSaveStatus) =>
    setCheckinStatus((current) => ({ ...current, [pairId]: status }));

  const checkin = useMutation({
    mutationFn: ({ pairId, note }: { pairId: string; note: string }) =>
      studyPairsApi.checkin(pairId, note),
    onMutate: ({ pairId }) => setStatus(pairId, "saving"),
    onSuccess: async (_, { pairId }) => {
      await queryClient.invalidateQueries({ queryKey: ME_KEY });
      setStatus(pairId, "saved");
    },
    onError: (_, { pairId }) => setStatus(pairId, "error"),
  });

  const endPair = useMutation({
    mutationFn: (pairId: string) => studyPairsApi.end(pairId),
    onSuccess: () => void refresh(),
    onError: () => toast(texts.studyPairs.endError, "error"),
  });

  const openConversation = useMutation({
    mutationFn: (userId: string) => messagesApi.openDirect(userId),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void navigate({ to: "/mensagens", search: { conversation: conversation.id } });
    },
    onError: (error) => toast(conversationErrorMessage(error), "error"),
  });
  const openingPartnerId = openConversation.isPending ? openConversation.variables : null;

  // As perguntas do quebra-gelo vêm do catálogo do servidor; sem catálogo a proposta ainda
  // aparece, só o formulário do aceite espera.
  const proposals = me.data?.proposals ?? [];
  const icebreakers = useQuery({
    queryKey: ["study-pairs", "icebreakers"],
    queryFn: () => studyPairsApi.icebreakers(),
    enabled: proposals.some((proposal) => !proposal.myAccepted),
    staleTime: 30 * 60_000,
    retry: false,
  });
  const acceptProposal = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: StudyPairIcebreakerAnswers }) =>
      studyPairsApi.accept(id, answers),
    onMutate: () => setProposalError(null),
    onSuccess: ({ pairActive }) => {
      void refresh();
      if (pairActive) toast(texts.studyPairs.proposals.active, "success");
    },
    onError: (error, { id }) =>
      setProposalError({
        id,
        message: error instanceof ApiError ? error.message : texts.studyPairs.proposals.acceptError,
      }),
  });
  const declineProposal = useMutation({
    mutationFn: (id: string) => studyPairsApi.decline(id),
    onMutate: () => setProposalError(null),
    onSuccess: () => {
      void refresh();
      toast(texts.studyPairs.proposals.declined);
    },
    onError: (error, id) =>
      setProposalError({
        id,
        message:
          error instanceof ApiError ? error.message : texts.studyPairs.proposals.declineError,
      }),
  });

  const data = me.data;

  return (
    <div className="space-y-4">
      <StudyPairProposals
        proposals={proposals.map(toStudyPairProposal)}
        fields={(icebreakers.data?.items ?? []).map(toIcebreakerField)}
        fieldsLoading={icebreakers.isLoading}
        acceptingId={acceptProposal.isPending ? acceptProposal.variables.id : null}
        decliningId={declineProposal.isPending ? declineProposal.variables : null}
        errors={proposalError ? { [proposalError.id]: proposalError.message } : {}}
        onAccept={(id, answers) => acceptProposal.mutate({ id, answers })}
        onDecline={(id) => declineProposal.mutate(id)}
      />
      <GoalSearch
        disabled={request.isPending}
        onRequest={(goal, topic) => request.mutate({ goal, topic })}
      />
      <StudyPairsView
        loading={me.isLoading}
        loadError={me.isError}
        onRetry={() => void me.refetch()}
        pairs={(data?.pairs ?? []).map(toStudyPair)}
        openRequest={
          data?.openRequest
            ? { goal: data.openRequest.goal, topicLabel: topicLabel(data.openRequest.topic) }
            : null
        }
        topics={TOPIC_OPTIONS}
        popularGoals={popular.data?.items ?? []}
        onRequest={(input) => request.mutate(input)}
        requesting={request.isPending}
        requestError={requestError}
        errorAction={
          requestError === "STUDY_PAIRS_DISABLED" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={reenable.isPending}
              onClick={turnModuleOn}
            >
              {texts.studyPairs.reenable}
            </Button>
          ) : undefined
        }
        birthDateHref="/perfil"
        verifyEmailHref="/seguranca"
        onCancelRequest={() => cancelRequest.mutate()}
        cancelling={cancelRequest.isPending}
        onSaveCheckin={(pairId, note) => checkin.mutate({ pairId, note })}
        checkinStatus={checkinStatus}
        onEndPair={(pairId) => endPair.mutate(pairId)}
        endingPairId={endPair.isPending ? endPair.variables : null}
      />
      {/* O par ativo sai do ritual semanal para a conversa: abre a conversa direta com a pessoa. */}
      {(data?.pairs ?? []).length > 0 && (
        <PillRow label={texts.studyPairs.message}>
          {(data?.pairs ?? []).map((pair) => (
            <Button
              key={pair.id}
              type="button"
              size="sm"
              variant="outline"
              aria-label={`${texts.studyPairs.message}: ${pair.partner.name}`}
              disabled={openingPartnerId !== null}
              onClick={() => openConversation.mutate(pair.partner.id)}
            >
              {texts.studyPairs.message}
            </Button>
          ))}
        </PillRow>
      )}
    </div>
  );
}
