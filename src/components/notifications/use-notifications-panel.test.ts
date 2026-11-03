import type { Notification } from "@/types/application/notification/notification";
import { describe, expect, it } from "vitest";

import { toNotificationData } from "./use-notifications-panel";

/**
 * A prévia do conteúdo de origem (issue #392) vem do backend e precisa chegar à linha da lista.
 * O mapeamento é o único ponto entre a resposta da API e o design system, então é aqui que o
 * campo se perde se alguém mexer.
 */
function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notification_1",
    kind: "NEW_COMMENT",
    actorId: "user_2",
    actorName: "Ana",
    actorUsername: "ana",
    actorAvatar: null,
    title: "Novo comentário",
    body: "Ana comentou no seu post.",
    createdAt: "2026-11-03T12:00:00Z",
    read: false,
    href: "/api/feed/posts/post_1",
    ctaLabel: "Ver",
    ...overrides,
  };
}

describe("toNotificationData", () => {
  it("leva a prévia do conteúdo para a linha da notificação", () => {
    const data = toNotificationData(notification({ preview: "Olha o que eu aprendi hoje" }));

    expect(data.preview).toBe("Olha o que eu aprendi hoje");
  });

  it("mantém a linha como antes quando o backend não manda prévia", () => {
    const data = toNotificationData(notification());

    expect(data.preview).toBeUndefined();
    expect(data.body).toBe("Ana comentou no seu post.");
  });
});
