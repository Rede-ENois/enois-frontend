import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
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
import { HeartPulse, Sparkles } from "lucide-react";

import { preferencesApi } from "@/lib/api";
import { writeBatataMode } from "@/lib/batata-mode";
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
 * Uso saudável: o lembrete de pausa (local, do aparelho) + o centro de personalização
 * (assuntos preferidos, assuntos que não gosto e módulos desativados — com a fonte única
 * no backend, aplicada na navegação, nos feeds e nas recomendações) e, na segunda aba, os
 * avisos e as preferências de notificação da conta.
 *
 * A tela é montada aqui (e não pelo `HealthyUsageDialog` do design system) porque o pacote
 * publicado ainda não abre espaço para conteúdo extra dentro do diálogo. O conteúdo da aba
 * "Bem-estar" segue a mesma estrutura e os mesmos textos do pacote.
 *
 * O BATATA é o único controle que vale no clique, sem esperar o "Salvar": ele muda a cara da
 * tela inteira, e a pessoa precisa ver o resultado para decidir se é isso que quer. A gravação
 * vai junto (mesma rota de preferências), com o espelho local aplicado antes da resposta e
 * desfeito se o servidor recusar.
 */
export function HealthyUsageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const messages = useMessages().healthyUsageDialog;
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: personalization } = usePersonalization();

  const [tab, setTab] = useState<"bem-estar" | "notificacoes">("bem-estar");
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
  const [whatsNewEnabled, setWhatsNewEnabled] = useState(true);
  // Só aparece para quem o sistema está pedindo menos movimento: nas outras pessoas a chave
  // não teria efeito nenhum e só faria volume.
  const [reducedMotionDevice, setReducedMotionDevice] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab("bem-estar");
    const device = loadDeviceSettings();
    setEnabled(device.enabled);
    setMinutes(device.minutes);
    setForceMotion(device.forceMotion);
    setCardTilt(device.cardTilt);
    setReducedMotionDevice(device.reducedMotion);
  }, [open]);

  useEffect(() => {
    if (!open || !personalization) return;
    setLiked(personalization.likedTopics);
    setBlocked(personalization.blockedTopics);
    setDisabledModules(personalization.disabledModules);
    setNightRestReminder(personalization.nightRestReminder);
    setLiteMode(personalization.liteMode);
    setBatataMode(personalization.batataMode);
    setWhatsNewEnabled(personalization.whatsNewEnabled ?? true);
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
        whatsNewEnabled,
      }),
    onSuccess: () => {
      writeHealthyUsage({ enabled, minutes: clampMinutes(minutes) });
      // O atributo no <html> e o cache mais folgado entram pelo LiteModeEffects assim que a
      // preferência volta do servidor; o espelho no aparelho só adianta o próximo paint.
      writeLiteMode(liteMode);
      writeBatataMode(batataMode);
      writeForceMotion(forceMotion);
      writeCardTilt(cardTilt);
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
      toast(texts.personalization.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.personalization.saveError, "error"),
  });

  /**
   * O interruptor do BATATA aplica e grava na hora. Otimista no cache: o `data-batata` no
   * `<html>` sai do LiteModeEffects, que lê a preferência — sem a atualização antecipada a tela
   * só mudaria depois da volta do servidor.
   */
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

  // BATATA já entrega o que o lite entrega (e mais): as animações continuam desligadas de
  // qualquer jeito, então a chave de "manter as animações" não teria efeito nenhum.
  const animationsOff = liteMode || batataMode;

  // Um assunto não pode estar nos dois lados: marcar num remove do outro (o backend recusa
  // o conflito, e a tela evita chegar lá).
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
            <HeartPulse className="h-5 w-5 text-primary" />
            {messages.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "bem-estar" | "notificacoes")}>
          <TabsList className="w-full">
            {/* O cinza-arroxeado do pacote não alcança contraste no tema claro; aqui a aba ativa
                usa a cor de texto do tema para continuar legível nos dois modos. */}
            <TabsTrigger value="bem-estar" className={TAB_CLASS}>
              {texts.healthyUsage.tabs.wellbeing}
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
                  // O BATATA muda a cara da tela inteira; o app aplica e grava na hora.
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

            {/* Configuração de novidades do sistema e design */}
            <section className="space-y-3 border-t border-border-soft pt-4">
              <label className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-text-strong">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Novidades do sistema e design
                  </span>

                  <span className="mt-0.5 block text-xs text-text-subtle">
                    Exibir resumo com as melhorias de layout, novidades do design system e como
                    usá-las no primeiro acesso após cada atualização.
                  </span>
                </span>

                <Switch checked={whatsNewEnabled} onCheckedChange={setWhatsNewEnabled} />
              </label>

              <div>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline underline-offset-2 hover:opacity-80"
                  onClick={() => {
                    onOpenChange(false);
                    void navigate({ to: "/novidades" });
                  }}
                >
                  Ver histórico de novidades e atualizações →
                </button>
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
