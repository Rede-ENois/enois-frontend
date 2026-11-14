// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { NetworkNodeData } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { NetworkNodesSection } from "./network-nodes-section";

const mocks = vi.hoisted(() => ({
  nodes: vi.fn(),
  issueKey: vi.fn(),
  revokeKey: vi.fn(),
  approve: vi.fn(),
  changeStatus: vi.fn(),
  props: null as null | {
    nodes: { lastSeenAtLabel: string | null; keyPrefix: string | null; keyUsed: boolean }[];
    issuedKey: { nodeId: string; apiKey: string; prefix: string } | null;
    onIssueKey: (nodeId: string) => void;
    onRevokeKey: (nodeId: string) => void;
  },
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  adminNetworkApi: {
    nodes: mocks.nodes,
    issueKey: mocks.issueKey,
    revokeKey: mocks.revokeKey,
    approve: mocks.approve,
    changeStatus: mocks.changeStatus,
  },
}));

vi.mock("@rede-enois/design-system/domain", () => ({
  NetworkNodesSection: (props: {
    nodes: NetworkNodeData[];
    issuedKey: { nodeId: string; apiKey: string; prefix: string } | null;
    onIssueKey: (nodeId: string) => void;
    onRevokeKey: (nodeId: string) => void;
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
