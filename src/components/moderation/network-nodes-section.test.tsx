// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NetworkNodeData } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";

import { NetworkNodesSection } from "./network-nodes-section";

const mocks = vi.hoisted(() => ({
  nodes: vi.fn(),
  issueKey: vi.fn(),
  revokeKey: vi.fn(),
  approve: vi.fn(),
  changeStatus: vi.fn(),
  provisionToken: vi.fn(),
  profileGet: vi.fn(),
  props: null as null | {
    nodes: { lastSeenAtLabel: string | null; keyPrefix: string | null; keyUsed: boolean }[];
    issuedKey: { nodeId: string; apiKey: string; prefix: string } | null;
    onIssueKey: (nodeId: string) => void;
    onRevokeKey: (nodeId: string) => void;
    provisionToken?: {
      onProvision: (input: {
        serverName: string;
        ownerUsername: string;
        profiles: string[];
      }) => void;
      provisionPending?: boolean;
      issuedToken: { token: string; expiresAtLabel: string } | null;
      onDismissToken: () => void;
      provisionError?: string | null;
      profileOptions: { id: string; label: string }[];
    };
  },
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string | undefined,
      message: string,
    ) {
      super(message);
    }
  },
  adminNetworkApi: {
    nodes: mocks.nodes,
    issueKey: mocks.issueKey,
    revokeKey: mocks.revokeKey,
    approve: mocks.approve,
    changeStatus: mocks.changeStatus,
    provisionToken: mocks.provisionToken,
  },
  profileApi: {
    get: mocks.profileGet,
  },
}));

vi.mock("@rede-enois/design-system/domain", () => ({
  NetworkNodesSection: (props: {
    nodes: NetworkNodeData[];
    issuedKey: { nodeId: string; apiKey: string; prefix: string } | null;
    onIssueKey: (nodeId: string) => void;
    onRevokeKey: (nodeId: string) => void;
    provisionToken?: {
      onProvision: (input: {
        serverName: string;
        ownerUsername: string;
        profiles: string[];
      }) => void;
      provisionPending?: boolean;
      issuedToken: { token: string; expiresAtLabel: string } | null;
      onDismissToken: () => void;
      provisionError?: string | null;
      profileOptions: { id: string; label: string }[];
    };
  }) => {
    mocks.props = props;
    return <p>secao</p>;
  },
}));

vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;

beforeEach(() => {
  mocks.nodes.mockReset();
  mocks.issueKey.mockReset();
  mocks.revokeKey.mockReset();
  mocks.provisionToken.mockReset();
  mocks.profileGet.mockReset();
  mocks.props = null;
  root = createRoot(document.createElement("div"));
});

afterEach(() => act(() => root.unmount()));

function propsOf(): NonNullable<typeof mocks.props> {
  if (!mocks.props) throw new Error("a visão ainda não renderizou");
  return mocks.props;
}

async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <NetworkNodesSection />
      </QueryClientProvider>,
    ),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

const backendNode = {
  id: "nd_1",
  displayName: "no-1",
  ownerUserId: "u1",
  status: "ACTIVE" as const,
  profiles: ["NODE_MEDIA"],
  region: "sa-east1",
  runtimeVersion: "1.0.0",
  lastSeenAt: "2026-11-11T12:00:00Z",
  operable: true,
  keyId: "nk_9",
  keyPrefix: "enk_nd_1_",
  keyUsed: true,
};

it("formata o último contato e repassa a chave vigente do nó", async () => {
  mocks.nodes.mockResolvedValue([backendNode]);
  await render();

  const view = propsOf().nodes[0];
  expect(view.lastSeenAtLabel).not.toBeNull();
  expect(view.keyPrefix).toBe("enk_nd_1_");
  expect(view.keyUsed).toBe(true);
});

it("mostra a chave recém-gerada com o nó a que ela pertence", async () => {
  mocks.nodes.mockResolvedValue([backendNode]);
  mocks.issueKey.mockResolvedValue({ keyId: "nk_10", apiKey: "enk_novo", prefix: "enk_nd_1_" });
  await render();

  await act(async () => propsOf().onIssueKey("nd_1"));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(propsOf().issuedKey).toEqual({
    keyId: "nk_10",
    nodeId: "nd_1",
    apiKey: "enk_novo",
    prefix: "enk_nd_1_",
  });
});

it("revoga a chave vigente pelo id, nunca com id vazio", async () => {
  mocks.nodes.mockResolvedValue([backendNode]);
  mocks.revokeKey.mockResolvedValue(backendNode);
  await render();

  await act(async () => propsOf().onRevokeKey("nd_1"));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(mocks.revokeKey).toHaveBeenCalledWith("nd_1", "nk_9");
});

it("oferece o token de provisionamento com os perfis que o backend aceita", async () => {
  mocks.nodes.mockResolvedValue([]);
  await render();

  const provision = propsOf().provisionToken;
  expect(provision?.profileOptions).toContainEqual({ id: "NODE_MEDIA", label: "Mídia" });
  expect(provision?.profileOptions).toContainEqual({ id: "NODE_EMERGENCY", label: "Emergência" });
});

it("resolve o @dono antes de emitir o token e mostra o token com a validade", async () => {
  mocks.nodes.mockResolvedValue([]);
  mocks.profileGet.mockResolvedValue({ id: "u_owner", username: "luna" });
  mocks.provisionToken.mockResolvedValue({
    token: "npt_123",
    expiresAt: "2026-11-15T12:00:00Z",
  });
  await render();

  await act(async () =>
    propsOf().provisionToken?.onProvision({
      serverName: "vps-casa",
      ownerUsername: "@luna",
      profiles: ["NODE_MEDIA"],
    }),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(mocks.profileGet).toHaveBeenCalledWith("luna");
  expect(mocks.provisionToken).toHaveBeenCalledWith({
    displayName: "vps-casa",
    ownerUserId: "u_owner",
    profiles: ["NODE_MEDIA"],
  });
  expect(propsOf().provisionToken?.issuedToken).toEqual({
    token: "npt_123",
    expiresAtLabel: expect.any(String),
  });
});

it("conta dona inexistente vira erro no formulário, sem chamar a emissão", async () => {
  mocks.nodes.mockResolvedValue([]);
  mocks.profileGet.mockRejectedValue(
    new ApiError(404, "USER_NOT_FOUND", "Usuário não encontrado."),
  );
  await render();

  await act(async () =>
    propsOf().provisionToken?.onProvision({
      serverName: "vps-casa",
      ownerUsername: "ninguem",
      profiles: ["NODE_MEDIA"],
    }),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(mocks.provisionToken).not.toHaveBeenCalled();
  expect(propsOf().provisionToken?.provisionError).toContain("@ninguem");
});

it("falha de rede não vaza mensagem técnica: o formulário mostra o texto do app", async () => {
  mocks.nodes.mockResolvedValue([]);
  mocks.profileGet.mockRejectedValue(new Error("Failed to fetch"));
  await render();

  await act(async () =>
    propsOf().provisionToken?.onProvision({
      serverName: "vps-casa",
      ownerUsername: "luna",
      profiles: ["NODE_MEDIA"],
    }),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(propsOf().provisionToken?.provisionError).toBe(texts.moderator.network.provisionFailed);
});

it("fechar o token limpa a emissão para o próximo nó começar do zero", async () => {
  mocks.nodes.mockResolvedValue([]);
  mocks.profileGet.mockResolvedValue({ id: "u_owner", username: "luna" });
  mocks.provisionToken.mockResolvedValue({
    token: "npt_123",
    expiresAt: "2026-11-15T12:00:00Z",
  });
  await render();

  await act(async () =>
    propsOf().provisionToken?.onProvision({
      serverName: "vps-casa",
      ownerUsername: "luna",
      profiles: ["NODE_MEDIA"],
    }),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  await act(async () => propsOf().provisionToken?.onDismissToken());

  expect(propsOf().provisionToken?.issuedToken).toBeNull();
});

it("resposta que chega depois de fechar não reabre o token de uma emissão descartada", async () => {
  mocks.nodes.mockResolvedValue([]);
  mocks.profileGet.mockResolvedValue({ id: "u_owner", username: "luna" });
  let resolveProvision!: (issued: { token: string; expiresAt: string }) => void;
  mocks.provisionToken.mockReturnValue(
    new Promise((resolve) => {
      resolveProvision = resolve;
    }),
  );
  await render();

  await act(async () =>
    propsOf().provisionToken?.onProvision({
      serverName: "vps-casa",
      ownerUsername: "luna",
      profiles: ["NODE_MEDIA"],
    }),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  await act(async () => propsOf().provisionToken?.onDismissToken());
  await act(async () => {
    resolveProvision({ token: "npt_tarde", expiresAt: "2026-11-15T12:00:00Z" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(propsOf().provisionToken?.issuedToken).toBeNull();
});
