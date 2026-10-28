import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import {
  HealthyUsageDialog as HealthyUsageDialogView,
  type HealthyUsageValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { preferencesApi } from "@/lib/api";
import {
  HEALTHY_USAGE_MAX_MINUTES,
  HEALTHY_USAGE_MIN_MINUTES,
  clampMinutes,
  readHealthyUsage,
  writeHealthyUsage,
} from "@/lib/healthy-usage";
import {
  prefersReducedMotion,
  readForceMotion,
  writeForceMotion,
  writeLiteMode,
} from "@/lib/lite-mode";
import { usePersonalization } from "@/lib/use-personalization";

/** Os assuntos reais da plataforma (mesma taxonomia das comunidades); "Todas" não é assunto. */
const TOPIC_OPTIONS = TOPICS.filter((topic) => topic !== "Todas").map((topic) => ({
  value: topic,
  label: TOPIC_LABELS[topic],
}));

function loadDeviceSettings() {
  const config = readHealthyUsage();
  return {
    enabled: config.enabled,
    minutes: config.minutes,
    forceMotion: readForceMotion(),
    reducedMotion: prefersReducedMotion(),
  };
}

/**
 * Uso saudável: o lembrete de pausa (local, do aparelho) + o centro de personalização
 * (assuntos preferidos, assuntos que não gosto e módulos desativados — com a fonte única
 * no backend, aplicada na navegação, nos feeds e nas recomendações).
 */
export function HealthyUsageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: personalization } = usePersonalization();

  const save = useMutation({
    mutationFn: (values: HealthyUsageValues) =>
      preferencesApi.setPersonalization({
        likedTopics: values.liked,
        blockedTopics: values.blocked,
        disabledModules: values.disabledModules,
        nightRestReminder: values.nightRestReminder,
        liteMode: values.liteMode,
      }),
    onSuccess: (_, values) => {
      writeHealthyUsage({ enabled: values.enabled, minutes: clampMinutes(values.minutes) });
      // O atributo no <html> e o cache mais folgado entram pelo LiteModeEffects assim que a
      // preferência volta do servidor; o espelho no aparelho só adianta o próximo paint.
      writeLiteMode(values.liteMode);
      writeForceMotion(values.forceMotion);
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
      toast(texts.personalization.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.personalization.saveError, "error"),
  });

  return (
    <HealthyUsageDialogView
      open={open}
      onOpenChange={onOpenChange}
      loadDeviceSettings={loadDeviceSettings}
      personalization={personalization}
      topics={TOPIC_OPTIONS}
      minMinutes={HEALTHY_USAGE_MIN_MINUTES}
      maxMinutes={HEALTHY_USAGE_MAX_MINUTES}
      savePending={save.isPending}
      onSave={(values) => save.mutate(values)}
    />
  );
}
