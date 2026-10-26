import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  type MentionTextareaProps,
  MentionTextarea as MentionTextareaView,
} from "@rede-enois/design-system/domain";

import { usersApi } from "@/lib/api";

/** Campo de escrita com @menção: a busca de quem mencionar sai daqui (a partir de 2 letras). */
export function MentionTextarea(
  props: Omit<MentionTextareaProps, "mentionResults" | "onMentionQueryChange">,
) {
  const [mentionQuery, setMentionQuery] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", mentionQuery],
    queryFn: () => usersApi.search(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  return (
    <MentionTextareaView
      {...props}
      mentionResults={results}
      onMentionQueryChange={setMentionQuery}
    />
  );
}
