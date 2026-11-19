import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Campaign } from "@/types/application/roleplay/campaign";
import type { CampaignMember } from "@/types/application/roleplay/campaign-member";
import type { CampaignMessage } from "@/types/application/roleplay/campaign-message";
import type { ChatPresence } from "@/types/application/roleplay/chat-presence";
import type { Roll } from "@/types/application/roleplay/roll";
import type { Sheet } from "@/types/application/roleplay/sheet";
import type { SheetTemplate } from "@/types/application/roleplay/sheet-template";
import type { GameTable } from "@/types/application/roleplay/table";
import type { TableState } from "@/types/application/roleplay/table-state";
import type { WorldEntry } from "@/types/application/roleplay/world";
import type {
  RoleplayCampaignHeaderProps,
  RoleplayChatMessageView,
  RoleplayChatPanelProps,
  RoleplayChatPresenceView,
  RoleplayDicePanelProps,
  RoleplayRollView,
  RoleplaySheetCard,
  RoleplaySheetPanelProps,
  RoleplayTableView,
  RoleplayTablesPanelProps,
  RoleplayWorldEntryView,
  RoleplayWorldPanelProps,
} from "@rede-enois/design-system/domain";
import { RoleplayCampaignPage } from "@rede-enois/design-system/domain";
import { EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { Dices } from "lucide-react";

import { callsApi, roleplayApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { useIsAuthenticated } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/roleplay/$slug")({
  head: () => ({ meta: [{ title: texts.roleplay.seoTitle }] }),
  component: CampaignPage,
});

/**
 * A campanha. O design system desenha; este contêiner busca e corta. Tudo que o participante vê
 * vem do servidor já recortado: a ficha do outro só chega com o que o dono abriu, o histórico de
 * dados só com o que a rolagem expõe, e uma entrada de mundo editável só com quem pode editá-la.
 * O cliente nunca decide resultado nem visibilidade — só envia a intenção.
 */
function CampaignPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authenticated = useIsAuthenticated();

  const {
    data: campaign,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["roleplay", "campaign", slug],
    queryFn: () => roleplayApi.get(slug),
  });

  const join = useMutation({
    mutationFn: () => roleplayApi.join(campaign!.id),
    onSuccess: (result) => {
      toast(result.status === "JOINED" ? texts.roleplay.join : texts.roleplay.pending);
      void queryClient.invalidateQueries({ queryKey: ["roleplay"] });
    },
    onError: () => toast(texts.roleplay.joinError, "error"),
  });

  if (isLoading) {
    return (
      <AppContainer>
        <LoadingState label={texts.roleplay.loading} />
      </AppContainer>
    );
  }

  if (isError || !campaign) {
    return (
      <AppContainer>
        <EmptyState icon={Dices} title={texts.roleplay.notFound} />
      </AppContainer>
    );
  }

  const isMember = campaign.joined;
  const isMaster = campaign.viewerRole === "GAME_MASTER";

  const header: RoleplayCampaignHeaderProps = {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      name: campaign.name,
      description: campaign.description,
      gameSystem: campaign.gameSystem,
      systemFamily: campaign.systemFamily,
      visibility: campaign.visibility,
      status: campaign.status,
      members: campaign.members,
      viewerRole: campaign.viewerRole,
      joined: campaign.joined,
    },
    systemLabel: campaign.gameSystem,
    canJoin: authenticated && !isMember && campaign.status === "ACTIVE",
    joining: join.isPending,
    onJoin: () => join.mutate(),
  };

  if (!isMember) {
    return (
      <AppContainer>
        <RoleplayCampaignPage header={header} memberOnlyMessage={texts.roleplay.subtitle} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <MemberCampaign campaignId={campaign.id} isMaster={isMaster} header={header} />
    </AppContainer>
  );
}

/**
 * A campanha de quem participa. Uma única instância da página do design system recebe os cinco
 * painéis; cada painel só busca quando a sua aba está ativa, para a mesa não carregar tudo de uma vez.
 */
function MemberCampaign({
  campaignId,
  isMaster,
  header,
}: {
  campaignId: string;
  isMaster: boolean;
  header: RoleplayCampaignHeaderProps;
}) {
  const [tab, setTab] = useState("table");

  return (
    <RoleplayCampaignPage
      header={header}
      activeTab={tab}
      onTabChange={setTab}
      panels={{
        tables: useTablesProps(campaignId, isMaster, tab === "table"),
        sheet: useSheetProps(campaignId, tab === "sheet"),
        dice: useDiceProps(campaignId, tab === "dice"),
        chat: useChatProps(campaignId, isMaster, tab === "chat"),
        world: useWorldProps(campaignId, tab === "world"),
      }}
    />
  );
}

// ----------------------------------------------------------------------------- mesas

function useTablesProps(
  campaignId: string,
  isMaster: boolean,
  enabled: boolean,
): RoleplayTablesPanelProps {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [joiningVoiceId, setJoiningVoiceId] = useState<string | null>(null);
  const [creatingTable, setCreatingTable] = useState(false);

  const { data: tablesData, isLoading } = useQuery({
    queryKey: ["roleplay", "tables", campaignId],
    queryFn: () => roleplayApi.tables(campaignId),
    enabled,
  });

  const { data: membersData } = useQuery({
    queryKey: ["roleplay", "members", campaignId],
    queryFn: () => roleplayApi.members(campaignId),
    enabled,
  });

  const tables = tablesData?.items ?? [];
  const members = membersData?.items ?? [];

  const { data: firstState } = useQuery({
    queryKey: ["roleplay", "tableState", tables[0]?.id ?? ""],
    queryFn: () => roleplayApi.tableState(campaignId, tables[0].id),
    enabled: enabled && tables.length > 0,
    refetchInterval: 15_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["roleplay", "tables", campaignId] });
    void queryClient.invalidateQueries({ queryKey: ["roleplay", "tableState"] });
  };

  return {
    tables: tables.map((table) =>
      tableView(table, table.id === tables[0]?.id ? firstState : undefined, members),
    ),
    loading: isLoading,
    canCreateTable: isMaster,
    creatingTable,
    onCreateTable: (name) => {
      setCreatingTable(true);
      roleplayApi
        .createTable(campaignId, name)
        .then(invalidate)
        .catch(() => toast(texts.roleplay.createError, "error"))
        .finally(() => setCreatingTable(false));
    },
    joiningVoiceId,
    onJoinVoice: (table) => {
      setJoiningVoiceId(table.id);
      roleplayApi
        .openTableVoice(campaignId, table.id)
        .then((call) => callsApi.join(call.id))
        .catch(() => toast(texts.roleplay.joinError, "error"))
        .finally(() => setJoiningVoiceId(null));
    },
    canEditScene: isMaster,
    onSaveScene: (table, scene) => {
      roleplayApi
        .saveScene(campaignId, table.id, scene)
        .then(invalidate)
        .catch(() => toast(texts.roleplay.entryError, "error"));
    },
    onAdvanceTurn: (table) => {
      roleplayApi
        .advanceTurn(campaignId, table.id)
        .then(invalidate)
        .catch(() => toast(texts.roleplay.joinError, "error"));
    },
  };
}

// ----------------------------------------------------------------------------- ficha

function useSheetProps(campaignId: string, enabled: boolean): RoleplaySheetPanelProps {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: template } = useQuery({
    queryKey: ["roleplay", "sheetTemplate", campaignId],
    queryFn: () => roleplayApi.sheetTemplate(campaignId),
    enabled,
  });

  const { data: mySheet, isLoading: isSheetLoading } = useQuery({
    queryKey: ["roleplay", "mySheet", campaignId],
    queryFn: () => roleplayApi.mySheet(campaignId),
    enabled,
  });

  const { data: board } = useQuery({
    queryKey: ["roleplay", "sheetBoard", campaignId],
    queryFn: () => roleplayApi.sheetBoard(campaignId),
    enabled,
  });

  const templateUrl = templateUrlFor(template);

  return {
    templateFields: templateUrl,
    sheet: mySheet
      ? {
          name: mySheet.name,
          values: Object.fromEntries(mySheet.entries.map((e) => [e.key, e.value])),
          derived: mySheet.derived.map((d) => ({ label: d.label, value: d.value })),
        }
      : null,
    board: (board ?? []).map(sheetCard),
    loading: isSheetLoading,
    onSave: (name, values) => {
      roleplayApi
        .saveSheet(campaignId, {
          name,
          entries: templateUrl.map((field) => ({
            key: field.key,
            value: values[field.key] ?? "",
          })),
        })
        .then(() => {
          toast(texts.roleplay.sheetSaved);
          void queryClient.invalidateQueries({ queryKey: ["roleplay", "mySheet", campaignId] });
          void queryClient.invalidateQueries({ queryKey: ["roleplay", "sheetBoard", campaignId] });
        })
        .catch(() => toast(texts.roleplay.sheetError, "error"));
    },
    onPublish: (card) => {
      roleplayApi
        .publishSheet(campaignId, card.id)
        .then(() => {
          toast(texts.roleplay.published);
          void queryClient.invalidateQueries({ queryKey: ["roleplay", "sheetBoard", campaignId] });
        })
        .catch(() => toast(texts.roleplay.publishError, "error"));
    },
    onUnpublish: (card) => {
      roleplayApi
        .unpublishSheet(campaignId, card.id)
        .then(() => {
          toast(texts.roleplay.unpublished);
          void queryClient.invalidateQueries({ queryKey: ["roleplay", "sheetBoard", campaignId] });
        })
        .catch(() => toast(texts.roleplay.publishError, "error"));
    },
  };
}

// ----------------------------------------------------------------------------- dados

function useDiceProps(campaignId: string, enabled: boolean): RoleplayDicePanelProps {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rolling, setRolling] = useState(false);

  const { data: rolls, isLoading } = useQuery({
    queryKey: ["roleplay", "rolls", campaignId],
    queryFn: () => roleplayApi.rolls(campaignId),
    enabled,
  });

  return {
    rolls: (rolls ?? []).map(rollView),
    loading: isLoading,
    rolling,
    onRoll: (expression, label) => {
      setRolling(true);
      roleplayApi
        .roll(campaignId, expression, label ?? undefined)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["roleplay", "rolls", campaignId] });
        })
        .catch(() => toast(texts.roleplay.rollError, "error"))
        .finally(() => setRolling(false));
    },
  };
}

// ----------------------------------------------------------------------------- chat

function useChatProps(
  campaignId: string,
  isMaster: boolean,
  enabled: boolean,
): RoleplayChatPanelProps {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["roleplay", "chat", campaignId],
    queryFn: () => roleplayApi.messages(campaignId, {}),
    enabled,
    refetchInterval: 10_000,
  });

  const { data: presence } = useQuery({
    queryKey: ["roleplay", "presence", campaignId],
    queryFn: () => roleplayApi.presence(campaignId),
    enabled,
    refetchInterval: 20_000,
  });

  const { data: membersData } = useQuery({
    queryKey: ["roleplay", "members", campaignId],
    queryFn: () => roleplayApi.members(campaignId),
    enabled,
  });

  const invalidateChat = () =>
    void queryClient.invalidateQueries({ queryKey: ["roleplay", "chat", campaignId] });

  return {
    messages: (messages ?? []).map(chatMessageView),
    presence: (presence ?? []).map((p) => presenceView(p, membersById(membersData?.items ?? []))),
    loading: isLoading,
    sending,
    onSend: (channel, content) => {
      setSending(true);
      roleplayApi
        .postMessage(campaignId, channel, content)
        .then(invalidateChat)
        .catch(() => toast(texts.roleplay.entryError, "error"))
        .finally(() => setSending(false));
    },
    onTogglePin: isMaster
      ? (message) => {
          const action = message.pinned
            ? roleplayApi.unpinMessage(campaignId, message.id)
            : roleplayApi.pinMessage(campaignId, message.id);
          void action.then(invalidateChat).catch(() => toast(texts.roleplay.entryError, "error"));
        }
      : undefined,
  };
}

// ----------------------------------------------------------------------------- mundo

function useWorldProps(campaignId: string, enabled: boolean): RoleplayWorldPanelProps {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [kind, setKind] = useState<WorldEntry["kind"] | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["roleplay", "world", campaignId, kind],
    queryFn: () => roleplayApi.worldEntries(campaignId, { kind: kind ?? undefined }),
    enabled,
  });

  const invalidateWorld = () =>
    void queryClient.invalidateQueries({ queryKey: ["roleplay", "world", campaignId] });

  return {
    entries: (entries ?? []).map(worldEntryView),
    loading: isLoading,
    kind,
    onKindChange: setKind,
    savingEntry,
    onSaveEntry: (values, entry) => {
      setSavingEntry(true);
      const request = entry
        ? roleplayApi.updateWorldEntry(campaignId, entry.id, values)
        : roleplayApi.saveWorldEntry(campaignId, values);

      void request
        .then(() => {
          toast(texts.roleplay.entrySaved);
          invalidateWorld();
        })
        .catch(() => toast(texts.roleplay.entryError, "error"))
        .finally(() => setSavingEntry(false));
    },
    onDeleteEntry: (entry) => {
      void roleplayApi
        .deleteWorldEntry(campaignId, entry.id)
        .then(() => {
          toast(texts.roleplay.entryDeleted);
          invalidateWorld();
        })
        .catch(() => toast(texts.roleplay.entryError, "error"));
    },
  };
}

// ----------------------------------------------------------------------------- corte API → view

/** O backend recorta a ficha; aqui só o formato muda, nenhum campo novo nasce. */
function tableView(
  table: GameTable,
  state: TableState | undefined,
  members: CampaignMember[],
): RoleplayTableView {
  const byName = new Map(members.map((m) => [m.userId, m.name]));
  const active = state?.activeTurnUserId ?? null;
  return {
    id: table.id,
    name: table.name,
    voiceOpen: Boolean(table.hasVoice) && table.open,
    scene: state?.scene ?? null,
    turnOrder: (state?.turnOrder ?? []).map((id) => byName.get(id) ?? id.slice(0, 8)),
    activeTurn: active ? (byName.get(active) ?? active.slice(0, 8)) : null,
    canAdvanceTurn: Boolean(active),
  };
}

function sheetCard(sheet: Sheet): RoleplaySheetCard {
  return {
    id: sheet.id,
    name: sheet.name,
    fields: sheet.entries
      .filter((entry) => entry.visibility !== "PRIVATE")
      .map((entry) => ({ label: entry.key, value: entry.value })),
    published: false,
  };
}

function rollView(roll: Roll): RoleplayRollView {
  return {
    id: roll.id,
    expression: roll.expression,
    dice: roll.dice,
    total: roll.total,
    label: roll.label,
  };
}

function chatMessageView(message: CampaignMessage): RoleplayChatMessageView {
  return {
    id: message.id,
    channel: message.channel,
    content: message.content,
    pinned: message.pinned,
  };
}

function presenceView(
  presence: ChatPresence,
  byId: Map<string, CampaignMember>,
): RoleplayChatPresenceView {
  const who = byId.get(presence.userId);
  return { name: who?.name ?? presence.userId.slice(0, 8), role: who?.role ?? "PLAYER" };
}

function membersById(members: CampaignMember[]): Map<string, CampaignMember> {
  return new Map(members.map((m) => [m.userId, m]));
}

/** A regra de quem pode editar uma entrada é do servidor; aqui só se espelha o que ele já cortou. */
function worldEntryView(entry: WorldEntry): RoleplayWorldEntryView {
  const viewerId = getCurrentUserId();
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
    tags: entry.tags,
    linkedSheetName: entry.linkedSheetName,
    canEdit: entry.authorId === viewerId,
  };
}

function templateUrlFor(template: SheetTemplate | undefined) {
  return (template?.fields ?? []).map((field) => ({ key: field.key, label: field.label }));
}
