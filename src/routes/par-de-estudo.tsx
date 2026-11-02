import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { StudyPairs } from "@/components/study-pairs/study-pairs";

export const Route = createFileRoute("/par-de-estudo")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: texts.studyPairs.seoTitle },
      { name: "description", content: texts.studyPairs.seoDescription },
    ],
  }),
  component: () => (
    <AppContainer>
      <StudyPairs />
    </AppContainer>
  ),
});
