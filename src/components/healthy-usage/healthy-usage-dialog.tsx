import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { HOME_TABS, POST_TYPE_FILTERS, TAB_LABELS } from "@/constants/feed-filters";
import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { useMessages } from "@rede-enois/design-system";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Pill,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import { HeartPulse, SlidersHorizontal } from "lucide-react";

import { preferencesApi } from "@/lib/api";
import { writeBatataMode } from "@/lib/batata-mode";
import {
  readLastFeedTab,
  readLastFeedTypeFilter,
  rememberFeedTab,
  rememberFeedTypeFilter,
} from "@/lib/feed/last-tab";
import {
  HEALTHY_USAGE_MAX_MINUTES,
  HEALTHY_USAGE_MIN_MINUTES,
  clampMinutes,
  readHealthyUsage,
  writeHealthyUsage,
} from "@/lib/healthy-usage";
import {
  prefersReducedMotion,
  readCardTilt,
  readForceMotion,
  writeCardTilt,
  writeForceMotion,
  writeLiteMode,
} from "@/lib/lite-mode";
import { usePersonalization } from "@/lib/use-personalization";

import { NotificationPreferencesPanel } from "../notifications/notification-preferences-panel";

const TAB_CLASS =
  "flex-1 justify-center data-[state=active]:bg-primary/15 data-[state=active]:text-text-strong data-[state=active]:ring-primary/40";

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
    cardTilt: readCardTilt(),
    reducedMotion: prefersReducedMotion(),
  };
}

/**
 * Uso saudável e personalização:
 * - Bem-estar: lembrete de pausa (local, do aparelho), descanso noturno, modo lite, modo BATATA
 *   e opções de movimento.
 * - Personalização: feed padrão, tipos de publicação, assuntos preferidos/bloqueados e módulos.
 * - Notificações: avisos no dispositivo e preferências de notificação da conta.
 */
export function HealthyUsageDialog({
  open,
  onOpenChange,
  initialTab = "bem-estar",
  currentFeedTab,
  onFeedTabChange,
  currentTypeFilter,
  onTypeFilterChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "bem-estar" | "personalizacao" | "notificacoes";
  currentFeedTab?: HomeTab;
  onFeedTabChange?: (tab: HomeTab) => void;
  currentTypeFilter?: string;
  onTypeFilterChange?: (filter: string) => void;
}) {
  const messages = useMessages().healthyUsageDialog;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: personalization } = usePersonalization();

  const [tab, setTab] = useState<"bem-estar" | "personalizacao" | "notificacoes">("bem-estar");
  const [feedTab, setFeedTab] = useState<HomeTab>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [enabled, setEnabled] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [liked, setLiked] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [disabledModules, setDisabledModules] = useState<string[]>([]);
  const [nightRestReminder, setNightRestReminder] = useState(true);
  const [liteMode, setLiteMode] = useState(false);
  const [batataMode, setBatataMode] = useState(false);
  const [forceMotion, setForceMotion] = useState(false);
  const [cardTilt, setCardTilt] = useState(true);
  // Só aparece para quem o sistema está pedindo menos movimento: nas outras pessoas a chave
  // não teria efeito nenhum e só faria volume.
  const [reducedMotionDevice, setReducedMotionDevice] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setFeedTab(currentFeedTab ?? readLastFeedTab());
    setTypeFilter(currentTypeFilter ?? readLastFeedTypeFilter());
    const device = loadDeviceSettings();
    setEnabled(device.enabled);
    setMinutes(device.minutes);
    setForceMotion(device.forceMotion);
    setCardTilt(device.cardTilt);
    setReducedMotionDevice(device.reducedMotion);
  }, [open, initialTab, currentFeedTab, currentTypeFilter]);

  useEffect(() => {
    if (!open || !personalization) return;
    setLiked(personalization.likedTopics);
    setBlocked(personalization.blockedTopics);
    setDisabledModules(personalization.disabledModules);
    setNightRestReminder(personalization.nightRestReminder);
    setLiteMode(personalization.liteMode);
    setBatataMode(personalization.batataMode);
  }, [open, personalization]);

  const save = useMutation({
    mutationFn: () =>
      preferencesApi.setPersonalization({
        likedTopics: liked,
        blockedTopics: blocked,
        disabledModules,
        nightRestReminder,
        liteMode,
        batataMode,
      }),
    onSuccess: () => {
      writeHealthyUsage({ enabled, minutes: clampMinutes(minutes) });
      writeLiteMode(liteMode);
      writeBatataMode(batataMode);
      writeForceMotion(forceMotion);
      writeCardTilt(cardTilt);
      rememberFeedTab(feedTab);
      rememberFeedTypeFilter(typeFilter);
      onFeedTabChange?.(feedTab);
      onTypeFilterChange?.(typeFilter);
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
      toast(texts.personalization.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.personalization.saveError, "error"),
  });

  const toggleBatata = useMutation({
    mutationFn: (on: boolean) => preferencesApi.setPersonalization({ batataMode: on }),
    onMutate: (on) => {
      const previous = queryClient.getQueryData<Personalization>(["personalization"]);
      writeBatataMode(on);
      queryClient.setQueryData<Personalization>(["personalization"], (current) =>
        current ? { ...current, batataMode: on } : current,
      );
      return { previous };
    },
    onError: (error, _on, context) => {
      const previous = context?.previous;
      writeBatataMode(previous?.batataMode ?? false);
      if (previous) queryClient.setQueryData<Personalization>(["personalization"], previous);
      toast(error instanceof Error ? error.message : texts.personalization.batataError, "error");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["personalization"] }),
  });

  const animationsOff = liteMode || batataMode;

  const toggleLiked = (topic: string) => {
    setLiked((current) =>
      current.includes(topic) ? current.filter((value) => value !== topic) : [...current, topic],
    );
    setBlocked((current) => current.filter((value) => value !== topic));
  };

  const toggleBlocked = (topic: string) => {
    setBlocked((current) =>
      current.includes(topic) ? current.filter((value) => value !== topic) : [...current, topic],
    );
    setLiked((current) => current.filter((value) => value !== topic));
  };

  const toggleModule = (module: string, off: boolean) => {
    setDisabledModules((current) =>
      off ? [...current, module] : current.filter((value) => value !== module),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-normal">
            {tab === "personalizacao" ? (
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            ) : (
              <HeartPulse className="h-5 w-5 text-primary" />
            )}
            {tab === "personalizacao" ? texts.healthyUsage.tabs.personalization : messages.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value as "bem-estar" | "personalizacao" | "notificacoes")
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="bem-estar" className={TAB_CLASS}>
              {texts.healthyUsage.tabs.wellbeing}
            </TabsTrigger>

            <TabsTrigger value="personalizacao" className={TAB_CLASS}>
              {texts.healthyUsage.tabs.personalization}
            </TabsTrigger>

            <TabsTrigger value="notificacoes" className={TAB_CLASS}>
              {texts.healthyUsage.tabs.notifications}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bem-estar" className="space-y-6 pt-1">
            <p className="text-sm text-muted-foreground">{messages.description}</p>

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-strong">
                  {messages.switchLabel}
                </span>

                <span className="mt-0.5 block text-xs text-text-subtle">{messages.switchHint}</span>
              </span>

              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-text-strong">{messages.minutesLabel}</span>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={HEALTHY_USAGE_MIN_MINUTES}
                  max={HEALTHY_USAGE_MAX_MINUTES}
                  value={minutes}
                  disabled={!enabled}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                  className="w-28"
                />

                <span className="text-sm text-text-subtle">{messages.minutesUnit}</span>
              </div>

              <span className="block text-xs text-text-subtle">{messages.minutesHint}</span>
            </label>

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-strong">
                  {messages.nightRestTitle}
                </span>

                <span className="mt-0.5 block text-xs text-text-subtle">
                  {messages.nightRestDescription}
                </span>
              </span>

              <Switch checked={nightRestReminder} onCheckedChange={setNightRestReminder} />
            </label>

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-strong">
                  {messages.liteTitle}
                </span>

                <span className="mt-0.5 block text-xs text-text-subtle">
                  {messages.liteDescription}
                </span>

                <span className="mt-1.5 block text-xs text-text-subtle">{messages.liteWhy}</span>
              </span>

              <Switch checked={liteMode} onCheckedChange={setLiteMode} />
            </label>

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-strong">
                  {messages.batataTitle}
                </span>

                <span className="mt-0.5 block text-xs text-text-subtle">
                  {messages.batataDescription}
                </span>

                <span className="mt-1.5 block text-xs text-text-subtle">{messages.batataWhy}</span>
              </span>

              <Switch
                checked={batataMode}
                onCheckedChange={(on) => {
                  setBatataMode(on);
                  toggleBatata.mutate(on);
                }}
              />
            </label>

            {reducedMotionDevice && (
              <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-strong">
                    {messages.forceMotionTitle}
                  </span>

                  <span className="mt-0.5 block text-xs text-text-subtle">
                    {messages.forceMotionDescription}
                  </span>
                </span>

                <Switch
                  checked={forceMotion && !animationsOff}
                  disabled={animationsOff}
                  onCheckedChange={setForceMotion}
                />
              </label>
            )}

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-border-soft bg-surface-card p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-strong">
                  {messages.cardTiltTitle}
                </span>

                <span className="mt-0.5 block text-xs text-text-subtle">
                  {messages.cardTiltDescription}
                </span>
              </span>

              <Switch checked={cardTilt} onCheckedChange={setCardTilt} />
            </label>

            <div className="flex justify-end border-t border-border-soft pt-4">
              <Button
                className="rounded-full"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {messages.save}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="personalizacao" className="space-y-6 pt-1">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-text-strong">
                {texts.healthyUsage.personalization.feedTitle}
              </h3>

              <p className="text-xs text-text-subtle">
                {texts.healthyUsage.personalization.feedHint}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {HOME_TABS.filter((opcao) => opcao !== "CORPORATE").map((opcao) => (
                  <Pill key={opcao} active={feedTab === opcao} onClick={() => setFeedTab(opcao)}>
                    {TAB_LABELS[opcao]}
                  </Pill>
                ))}
              </div>
            </section>

            {feedTab === "ALL" && (
              <section className="space-y-2 border-t border-border-soft pt-4">
                <h3 className="text-sm font-semibold text-text-strong">
                  {texts.healthyUsage.personalization.postTypeTitle}
                </h3>

                <p className="text-xs text-text-subtle">
                  {texts.healthyUsage.personalization.postTypeHint}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {POST_TYPE_FILTERS.map((f) => (
                    <Pill
                      key={f.value}
                      active={typeFilter === f.value}
                      onClick={() => setTypeFilter(f.value)}
                    >
                      {f.label}
                    </Pill>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2 border-t border-border-soft pt-4">
              <h3 className="text-sm font-semibold text-text-strong">{messages.likeTitle}</h3>

              <p className="text-xs text-text-subtle">{messages.likeHint}</p>

              <div className="flex flex-wrap gap-1.5">
                {TOPIC_OPTIONS.map((topic) => (
                  <Pill
                    key={topic.value}
                    active={liked.includes(topic.value)}
                    onClick={() => toggleLiked(topic.value)}
                  >
                    {topic.label}
                  </Pill>
                ))}
              </div>
            </section>

            <section className="space-y-2 border-t border-border-soft pt-4">
              <h3 className="text-sm font-semibold text-text-strong">{messages.dislikeTitle}</h3>

              <p className="text-xs text-text-subtle">{messages.dislikeHint}</p>

              <div className="flex flex-wrap gap-1.5">
                {TOPIC_OPTIONS.map((topic) => (
                  <Pill
                    key={topic.value}
                    active={blocked.includes(topic.value)}
                    onClick={() => toggleBlocked(topic.value)}
                  >
                    {topic.label}
                  </Pill>
                ))}
              </div>
            </section>

            <section className="space-y-2 border-t border-border-soft pt-4">
              <h3 className="text-sm font-semibold text-text-strong">{messages.modulesTitle}</h3>

              <p className="text-xs text-text-subtle">{messages.modulesHint}</p>

              <div className="space-y-1">
                {messages.modules.map((module) => {
                  const off = disabledModules.includes(module.id);
                  return (
                    <label
                      key={module.id}
                      className="flex items-start justify-between gap-3 rounded-xl px-1 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-text-strong">{module.label}</span>

                        {module.hint && (
                          <span className="mt-0.5 block text-xs text-text-subtle">
                            {module.hint}
                          </span>
                        )}
                      </span>

                      <Switch
                        checked={!off}
                        onCheckedChange={(on) => toggleModule(module.id, !on)}
                      />
                    </label>
                  );
                })}
              </div>
            </section>

            <div className="flex justify-end border-t border-border-soft pt-4">
              <Button
                className="rounded-full"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {messages.save}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes" className="pt-1">
            <NotificationPreferencesPanel />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
