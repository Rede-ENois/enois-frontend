import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CallView } from "@/types/application/call/call-view";
import type { Campaign } from "@/types/application/roleplay/campaign";
import type { CampaignJoinRequest } from "@/types/application/roleplay/campaign-join-request";
import type { CampaignMember } from "@/types/application/roleplay/campaign-member";
import type { CampaignMessage } from "@/types/application/roleplay/campaign-message";
import type { ChatPresence } from "@/types/application/roleplay/chat-presence";
import type { CreateCampaignInput } from "@/types/application/roleplay/create-campaign-input";
import type { GameSystem } from "@/types/application/roleplay/game-system";
import type { LibraryPublication } from "@/types/application/roleplay/library";
import type { Roll } from "@/types/application/roleplay/roll";
import type { RollRequest } from "@/types/application/roleplay/roll-request";
import type { SaveSheetInput } from "@/types/application/roleplay/save-sheet-input";
import type { SaveWorldEntryInput } from "@/types/application/roleplay/save-world-entry-input";
import type { Sheet } from "@/types/application/roleplay/sheet";
import type { SheetTemplate } from "@/types/application/roleplay/sheet-template";
import type { GameTable } from "@/types/application/roleplay/table";
import type { TableSeat } from "@/types/application/roleplay/table-seat";
import type { TableState } from "@/types/application/roleplay/table-state";
import type { TableToken } from "@/types/application/roleplay/table-token";
import type { WorldEntry } from "@/types/application/roleplay/world";

import { api, buildQuery } from "../api-client";

/** Tipos aceitos pelo atlas do mundo, na ordem que aparecem no filtro. */
export const WORLD_KINDS = ["LOCALE", "CHARACTER", "ITEM", "PLOT", "LORE"] as const;

export const roleplayApi = {
  systems: () => api.get<GameSystem[]>("/roleplay/systems"),

  /** Catálogo público: só campanhas PUBLIC e ACTIVE, só apresentação. */
  list: ({
    query,
    cursor,
    limit = 20,
  }: { query?: string; cursor?: string | null; limit?: number } = {}) =>
    api.get<PageResponse<Campaign>>(`/roleplay/campaigns${buildQuery({ query, cursor, limit })}`),

  mine: (limit = 20) =>
    api.get<PageResponse<Campaign>>(`/roleplay/campaigns/mine${buildQuery({ limit })}`),

  get: (slugOrId: string) => api.get<Campaign>(`/roleplay/campaigns/${slugOrId}`),

  create: (data: CreateCampaignInput) => api.post<Campaign>("/roleplay/campaigns", data),

  update: (campaignId: string, data: Partial<CreateCampaignInput>) =>
    api.patch<Campaign>(`/roleplay/campaigns/${campaignId}`, data),

  /** Entra na hora ou pede entrada, conforme a campanha. */
  join: (campaignId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/join`, {}),

  invite: (campaignId: string, userId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/invite`, { userId }),

  leave: (campaignId: string) =>
    api.delete<StatusResponse>(`/roleplay/campaigns/${campaignId}/members/me`),

  members: (campaignId: string) =>
    api.get<CampaignMember[]>(`/roleplay/campaigns/${campaignId}/members`),

  removeMember: (campaignId: string, memberId: string) =>
    api.delete<StatusResponse>(`/roleplay/campaigns/${campaignId}/members/${memberId}`),

  transferMaster: (campaignId: string, memberId: string) =>
    api.post<StatusResponse>(
      `/roleplay/campaigns/${campaignId}/members/${memberId}/transfer-master`,
      {},
    ),

  requests: (campaignId: string) =>
    api.get<CampaignJoinRequest[]>(`/roleplay/campaigns/${campaignId}/requests`),

  approveRequest: (campaignId: string, requestId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/requests/${requestId}/approve`, {}),

  rejectRequest: (campaignId: string, requestId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/requests/${requestId}/reject`, {}),

  archive: (campaignId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/archive`, {}),

  // Fichas: o recorte de cada leitura é decisão do servidor.
  sheetTemplate: (campaignId: string) =>
    api.get<SheetTemplate>(`/roleplay/campaigns/${campaignId}/sheets/template`),

  saveSheetTemplate: (campaignId: string, fields: { key: string; maxVisibility: string }[]) =>
    api.post<SheetTemplate>(`/roleplay/campaigns/${campaignId}/sheets/template`, { fields }),

  mySheet: (campaignId: string) => api.get<Sheet>(`/roleplay/campaigns/${campaignId}/sheets/me`),

  saveSheet: (campaignId: string, data: SaveSheetInput) =>
    api.put<Sheet>(`/roleplay/campaigns/${campaignId}/sheets/me`, data),

  sheetBoard: (campaignId: string) =>
    api.get<Sheet[]>(`/roleplay/campaigns/${campaignId}/sheets/board`),

  publishSheet: (campaignId: string, sheetId: string) =>
    api.post<LibraryPublication>(`/roleplay/campaigns/${campaignId}/sheets/${sheetId}/publish`, {}),

  unpublishSheet: (campaignId: string, sheetId: string) =>
    api.delete<StatusResponse>(`/roleplay/campaigns/${campaignId}/sheets/${sheetId}/publish`),

  // Dados: sorteio e registro no servidor.
  roll: (campaignId: string, expression: string, label?: string) =>
    api.post<Roll>(`/roleplay/campaigns/${campaignId}/rolls`, { expression, label }),

  rolls: (campaignId: string, cursor?: string | null, limit = 30) =>
    api.get<Roll[]>(`/roleplay/campaigns/${campaignId}/rolls${buildQuery({ cursor, limit })}`),

  rollRequests: (campaignId: string) =>
    api.get<RollRequest[]>(`/roleplay/campaigns/${campaignId}/rolls/requests`),

  requestRoll: (
    campaignId: string,
    playerId: string,
    expression: string,
    label?: string,
    visibility?: string,
    reason?: string,
  ) =>
    api.post<RollRequest>(`/roleplay/campaigns/${campaignId}/rolls/requests`, {
      playerId,
      expression,
      label,
      visibility,
      reason,
    }),

  answerRollRequest: (campaignId: string, requestId: string, label?: string, visibility?: string) =>
    api.post<Roll>(`/roleplay/campaigns/${campaignId}/rolls/requests/${requestId}/answer`, {
      label,
      visibility,
    }),

  // Chat da mesa.
  postMessage: (
    campaignId: string,
    channel: string,
    content: string,
    recipientId?: string | null,
  ) =>
    api.post<CampaignMessage>(`/roleplay/campaigns/${campaignId}/chat`, {
      channel,
      content,
      recipientId,
    }),

  messages: (campaignId: string, { channel }: { channel?: string } = {}) =>
    api.get<CampaignMessage[]>(`/roleplay/campaigns/${campaignId}/chat${buildQuery({ channel })}`),

  pinnedMessages: (campaignId: string) =>
    api.get<CampaignMessage[]>(`/roleplay/campaigns/${campaignId}/chat/pinned`),

  pinMessage: (campaignId: string, messageId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/chat/${messageId}/pin`, {}),

  unpinMessage: (campaignId: string, messageId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/chat/${messageId}/unpin`, {}),

  presence: (campaignId: string) =>
    api.get<ChatPresence[]>(`/roleplay/campaigns/${campaignId}/chat/presence`),

  // Atlas do mundo.
  worldEntries: (campaignId: string, { kind, q }: { kind?: string; q?: string } = {}) =>
    api.get<WorldEntry[]>(`/roleplay/campaigns/${campaignId}/world${buildQuery({ kind, q })}`),

  saveWorldEntry: (campaignId: string, data: SaveWorldEntryInput) =>
    api.post<WorldEntry>(`/roleplay/campaigns/${campaignId}/world`, data),

  updateWorldEntry: (campaignId: string, entryId: string, data: SaveWorldEntryInput) =>
    api.put<WorldEntry>(`/roleplay/campaigns/${campaignId}/world/${entryId}`, data),

  deleteWorldEntry: (campaignId: string, entryId: string) =>
    api.delete<StatusResponse>(`/roleplay/campaigns/${campaignId}/world/${entryId}`),

  // Mesas e lugares.
  tables: (campaignId: string) =>
    api.get<PageResponse<GameTable>>(`/roleplay/campaigns/${campaignId}/tables`),

  createTable: (campaignId: string, name: string, open = true) =>
    api.post<GameTable>(`/roleplay/campaigns/${campaignId}/tables`, { name, open }),

  seats: (campaignId: string, tableId: string) =>
    api.get<TableSeat[]>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/seats`),

  sit: (campaignId: string, tableId: string) =>
    api.post<StatusResponse>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/sit`, {}),

  stand: (campaignId: string, tableId: string) =>
    api.delete<StatusResponse>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/sit`),

  tableState: (campaignId: string, tableId: string) =>
    api.get<TableState>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/state`),

  tableTokens: (campaignId: string, tableId: string) =>
    api.get<TableToken[]>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/tokens`),

  /** Abre (ou devolve) a sala de voz da mesa; a resposta é a chamada do Épapo (join de sempre). */
  openTableVoice: (campaignId: string, tableId: string) =>
    api.post<CallView>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/voice`, {
      kind: "AUDIO",
    }),

  /** A chamada aberta da mesa (nula quando ninguém está na voz). */
  openVoiceCallOfTable: (campaignId: string, tableId: string) =>
    api.get<CallView | null>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/voice/open`),

  /** Cena da mesa: o texto do que está acontecendo agora. */
  saveScene: (campaignId: string, tableId: string, scene: string) =>
    api.post<TableState>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/state/scene`, {
      scene,
    }),

  /** Passa a vez para o próximo da ordem. */
  advanceTurn: (campaignId: string, tableId: string) =>
    api.post<TableState>(`/roleplay/campaigns/${campaignId}/tables/${tableId}/state/turn`, {}),

  // Biblioteca pública.
  library: ({
    query,
    cursor,
    limit = 20,
  }: { query?: string; cursor?: string | null; limit?: number } = {}) =>
    api.get<PageResponse<LibraryPublication>>(
      `/roleplay/library${buildQuery({ query, cursor, limit })}`,
    ),

  libraryPublication: (publicationId: string) =>
    api.get<LibraryPublication>(`/roleplay/library/${publicationId}`),
};
