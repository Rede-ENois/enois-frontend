import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";

import {
  FEED_CROSS_POST_TYPES,
  crossPostFailureMessage,
  crossPostsToCorporate,
} from "./cross-post";

describe("crossPostsToCorporate", () => {
  it("replica os tipos que os dois feeds aceitam, com a oferta marcada", () => {
    for (const type of ["INSIGHT", "PROJECT", "OPPORTUNITY", "TUTORIAL", "ARTICLE"]) {
      expect(crossPostsToCorporate(type, true)).toBe(true);
    }
  });

  it("sem a oferta marcada, o post fica no feed social", () => {
    expect(crossPostsToCorporate("INSIGHT", false)).toBe(false);
  });

  it("não replica os tipos que o feed profissional não lista", () => {
    for (const type of ["QUESTION", "POLL", "BUSINESS"]) {
      expect(FEED_CROSS_POST_TYPES).not.toContain(type);
      expect(crossPostsToCorporate(type, true)).toBe(false);
    }
  });
});

describe("crossPostFailureMessage", () => {
  it("explica a recusa de replicar sem perfil profissional ativo", () => {
    const error = new ApiError(403, "NO_ACTIVE_CORPORATE_PROFILE", "forbidden");
    expect(crossPostFailureMessage(error)).toBe(texts.feed.composer.crossPost.noProfile);
  });

  it("qualquer outro erro fica com a mensagem da publicação", () => {
    expect(crossPostFailureMessage(new ApiError(500, "INTERNAL", "boom"))).toBeNull();
    expect(crossPostFailureMessage(new ApiError(403, "OTHER", "forbidden"))).toBeNull();
    expect(crossPostFailureMessage(new Error("rede"))).toBeNull();
    expect(crossPostFailureMessage("texto")).toBeNull();
  });
});
