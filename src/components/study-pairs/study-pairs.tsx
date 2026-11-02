import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { POST_TOPICS } from "@/constants/community-topics";
import { texts } from "@/texts";
import {
  type StudyPairRequestInput,
  type StudyPairSaveStatus,
  type StudyPairsErrorCode,
  StudyPairsView,
} from "@rede-enois/design-system/domain";
import { Button, useToast } from "@rede-enois/design-system/ui";

import { studyPairsApi } from "@/lib/api";
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

  const me = useQuery({ queryKey: ME_KEY, queryFn: () => studyPairsApi.me() });
  // Chips are a nice-to-have: a failure just hides them.
  const popular = useQuery({ queryKey: POPULAR_KEY, queryFn: () => studyPairsApi.popularGoals() });

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

  const data = me.data;

  return (
    <div className="space-y-4">
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
    </div>
  );
}
