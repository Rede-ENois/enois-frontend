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
  observability: vi.fn(),
  history: vi.fn(),
  apiRoutes: vi.fn(),
  openApiRequests: vi.fn(),
  /** A query do quadro liga ao abrir o nó; o que a view recebeu fica aqui. */
  detailObservability: null as null | {
    panel: {
      nodeId: string;
      generatedAt: string;
      series: { sampledAt: string; cpuPercent: number | null }[];
      console: { id: string; at: string; level: string; message: string }[];
      summary: {
        cpuAvgPercent: number | null;
        cpuMaxPercent: number | null;
        memoryMbLatest: number | null;
        diskFreeMbLatest: number | null;
        runningTasksLatest: number | null;
        sampleCount: number;
      };
      consoleLevels: Record<string, number>;
    } | null;
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    refreshedAtLabel?: string | null;
  },
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
    detail?: {
      observability?: {
        panel: {
          nodeId: string;
          generatedAt: string;
          series: { sampledAt: string; cpuPercent: number | null }[];
          console: { id: string; at: string; level: string; message: string }[];
          summary: {
            cpuAvgPercent: number | null;
            cpuMaxPercent: number | null;
            memoryMbLatest: number | null;
            diskFreeMbLatest: number | null;
            runningTasksLatest: number | null;
            sampleCount: number;
          };
          consoleLevels: Record<string, number>;
        } | null;
        loading?: boolean;
        error?: string | null;
        onRefresh?: () => void;
        refreshedAtLabel?: string | null;
      };
      onOpenNode?: (nodeId: string | null) => void;
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
    observability: mocks.observability,
    history: mocks.history,
    apiRoutes: mocks.apiRoutes,
    openApiRequests: mocks.openApiRequests,
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
    detail?: {
      observability?: {
        panel: {
          nodeId: string;
          generatedAt: string;
          series: { sampledAt: string; cpuPercent: number | null }[];
          console: { id: string; at: string; level: string; message: string }[];
          summary: {
            cpuAvgPercent: number | null;
            cpuMaxPercent: number | null;
            memoryMbLatest: number | null;
            diskFreeMbLatest: number | null;
            runningTasksLatest: number | null;
            sampleCount: number;
          };
          consoleLevels: Record<string, number>;
        } | null;
        loading?: boolean;
        error?: string | null;
        onRefresh?: () => void;
        refreshedAtLabel?: string | null;
      };
      onOpenNode?: (nodeId: string | null) => void;
    };
  }) => {
    mocks.props = props;
    mocks.detailObservability = props.detail?.observability ?? null;
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
  mocks.observability.mockReset();
  mocks.history.mockReset();
  mocks.history.mockResolvedValue([]);
  mocks.apiRoutes.mockReset();
  mocks.apiRoutes.mockResolvedValue([]);
  mocks.openApiRequests.mockReset();
  mocks.openApiRequests.mockResolvedValue([]);
  mocks.props = null;
  mocks.detailObservability = null;
  root = createRoot(document.createElement("div"));
});

afterEach(() => act(() => root.unmount()));

function propsOf(): NonNullable<typeof mocks.props> {
  if (!mocks.props) throw new Error("a visão ainda não renderizou");
  return mocks.props;
}

async function render() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
  degraded: false,
  latencyMs: 120,
  failureStreak: 0,
  quarantineReason: null,
  declaredCpuCores: 4,
  declaredMemoryMb: 8192,
  declaredDiskMb: 51200,
  declaredBandwidthMbps: 100,
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

const quadroDoBackend = {
  nodeId: "nd_1",
  generatedAt: "2026-11-15T12:02:00Z",
  series: [
    { sampledAt: "2026-11-15T12:00:00Z", cpuPercent: 12, memoryMb: 1024, diskFreeMb: 2048 },
    { sampledAt: "2026-11-15T12:01:00Z", cpuPercent: null, memoryMb: null, diskFreeMb: null },
  ],
  console: [{ id: "nl_1", at: "2026-11-15T12:01:00Z", level: "INFO", message: "aceito pela rede" }],
  summary: {
    cpuAvgPercent: 12,
    cpuMaxPercent: 12,
    memoryMbLatest: null,
    diskFreeMbLatest: null,
    runningTasksLatest: null,
    sampleCount: 2,
  },
  consoleLevels: { INFO: 1 },
};

/** Abre o nó: é o que o admin faz antes de ver o quadro daquele servidor. */
async function abrirNo() {
  mocks.nodes.mockResolvedValue([backendNode]);
  await render();
  // `onOpenNode` mora no `detail` do contrato da seção; abrir o nó é o que liga o quadro.
  await act(async () => propsOf().detail?.onOpenNode?.("nd_1"));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

it("abre o nó e pede o quadro ao vivo daquele nó", async () => {
  mocks.observability.mockResolvedValue(quadroDoBackend);
  await abrirNo();

  expect(mocks.observability).toHaveBeenCalledWith("nd_1");
});

it("quadro do backend vira o view model do design system, com as datas no fuso do app", async () => {
  mocks.observability.mockResolvedValue(quadroDoBackend);
  await abrirNo();

  const quadro = mocks.detailObservability;
  expect(quadro?.panel?.nodeId).toBe("nd_1");
  // 12:00 UTC é 09:00 em São Paulo: a mesma hora que o servidor e o navegador mostram.
  expect(quadro?.panel?.series[0]?.sampledAt).toContain("09:00");
  expect(quadro?.panel?.console[0]?.at).toContain("09:01");
  expect(quadro?.panel?.console[0]?.message).toBe("aceito pela rede");
  // A lacuna atravessa o mapeamento como lacuna: não vira zero no caminho.
  expect(quadro?.panel?.series[1]?.cpuPercent).toBeNull();
  expect(quadro?.panel?.summary.memoryMbLatest).toBeNull();
});

it("fracasso ao ler o quadro aparece como erro, não como nó sem dados", async () => {
  mocks.observability.mockRejectedValue(new Error("Failed to fetch"));
  await abrirNo();

  expect(mocks.detailObservability?.panel).toBeNull();
  expect(mocks.detailObservability?.error).toBe(texts.moderator.network.observabilityError);
});

it("recusa do servidor mostra a mensagem dela, que diz o motivo ao admin", async () => {
  mocks.observability.mockRejectedValue(
    new ApiError(404, "NODE_NOT_FOUND", "Servidor não encontrado."),
  );
  await abrirNo();

  expect(mocks.detailObservability?.error).toBe("Servidor não encontrado.");
});
