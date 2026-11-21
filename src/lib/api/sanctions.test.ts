import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../api-client", () => ({ api: mocks }));

const { sanctionsApi } = await import("./sanctions");

const response = () => ({
  serverNow: "2026-01-01T12:00:00Z",
  sanctions: [
    {
      id: "sanc_sintetica",
      userId: "user_sintetico",
      reportId: "report_sintetico",
      type: "SUSPENDED",
      reason: "Motivo sintético",
      status: "ACTIVE",
      createdAt: "2026-01-01T11:00:00Z",
      removedAt: null,
      deadline: { kind: "APPEAL", at: "2026-01-02T11:00:00Z" },
      evidence: { kind: "TEXT", text: "Trecho sintético associado à decisão" },
      canAppeal: true,
    },
  ],
  appeals: [],
});

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
});

describe("contrato das próprias penalidades", () => {
  it("preserva dueAt da QA junto do prazo com significado explícito", async () => {
    const data = response();
    const expected = {
      ...data,
      sanctions: [{ ...data.sanctions[0], dueAt: data.sanctions[0].deadline.at }],
    };
    mocks.get.mockResolvedValue(expected);
    await expect(sanctionsApi.mine()).resolves.toEqual(expected);
  });

  it("recusa dueAt inválido sem descartar silenciosamente o contrato da QA", async () => {
    const data = response();
    mocks.get.mockResolvedValue({
      ...data,
      sanctions: [{ ...data.sanctions[0], dueAt: "inválido" }],
    });
    await expect(sanctionsApi.mine()).rejects.toThrow();
  });

  it("recusa uma referência de horário inválida, em vez de fabricar contador", async () => {
    mocks.get.mockResolvedValue({ ...response(), serverNow: "data inválida" });
    await expect(sanctionsApi.mine()).rejects.toThrow();
  });

  it("aceita prazo de recurso e evidência segura sem confundir com término", async () => {
    const data = response();
    mocks.get.mockResolvedValue(data);
    await expect(sanctionsApi.mine()).resolves.toEqual(data);
    expect(mocks.get).toHaveBeenCalledWith("/me/sanctions");
  });

  it("não propaga campos extras de mídia ou identidade para a apresentação", async () => {
    const data = response();
    mocks.get.mockResolvedValue({
      ...data,
      reporter: "campo que não faz parte do contrato",
      sanctions: [{ ...data.sanctions[0], originalMediaUrl: "https://example.invalid/midia" }],
    });
    await expect(sanctionsApi.mine()).resolves.toEqual(data);
  });

  it.each([
    { kind: "APPEAL", at: null },
    { kind: "NONE", at: "2026-01-02T11:00:00Z" },
    { kind: "END", at: "sem prazo" },
  ])("recusa prazo incoerente %j", async (deadline) => {
    const data = response();
    mocks.get.mockResolvedValue({ ...data, sanctions: [{ ...data.sanctions[0], deadline }] });
    await expect(sanctionsApi.mine()).rejects.toThrow();
  });

  it("aceita ausência explícita de prazo e evidência", async () => {
    const data = response();
    const expected = {
      ...data,
      sanctions: [
        {
          ...data.sanctions[0],
          deadline: { kind: "NONE", at: null },
          evidence: { kind: "UNAVAILABLE", text: null },
        },
      ],
    };
    mocks.get.mockResolvedValue(expected);
    await expect(sanctionsApi.mine()).resolves.toEqual(expected);
  });

  it("preserva a falha da consulta para a tela tratar como erro", async () => {
    const failure = new Error("Consulta sintética indisponível");
    mocks.get.mockRejectedValue(failure);
    await expect(sanctionsApi.mine()).rejects.toBe(failure);
  });
});
