// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { GithubOrgImport } from "./github-org-import";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  orgs: vi.fn(),
  orgRepos: vi.fn(),
  importOrg: vi.fn(),
  dialog: null as null | Record<string, unknown>,
}));

vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
// O diálogo é do DS (e tem testes próprios lá); aqui o que importa é o que o app passa para ele.
vi.mock("@rede-enois/design-system/domain", () => ({
  GithubOrgImportDialog: (props: Record<string, unknown>) => {
    mocks.dialog = props;
    return null;
  },
}));
vi.mock("@/lib/api", async () => ({
  ApiError: (await import("@/lib/api-client")).ApiError,
  githubProfileApi: {
    orgs: mocks.orgs,
    orgRepos: mocks.orgRepos,
    importOrg: mocks.importOrg,
  },
}));

const repo = (name: string, extra: object = {}) => ({
  fullName: `enois-lab/${name}`,
  name,
  description: null,
  url: `https://github.com/enois-lab/${name}`,
  homepage: null,
  language: "TypeScript",
  topics: [],
  stars: 3,
  forks: 1,
  fork: false,
  archived: false,
  updatedAt: "2026-11-01T12:00:00Z",
  defaultBranch: "main",
  ...extra,
});

describe("GithubOrgImport", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = async () => {
    for (let i = 0; i < 5; i += 1) {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
    }
  };
  const dialog = () =>
    mocks.dialog! as {
      title: string;
      orgs: { items: { login: string }[] };
      repos: { rows: { fullName: string }[] };
      selectedOrg: string | null;
      activeOrg: { login: string } | null;
      selected: string[];
      importing: boolean;
      onSelectOrg: (login: string) => void;
      onToggle: (fullName: string) => void;
      onSelectAll: () => void;
      onClear: () => void;
      onImport: () => void;
    };

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.dialog = null;
    mocks.toast.mockReset();
    mocks.orgs.mockReset().mockResolvedValue([
      {
        login: "enois-lab",
        name: "ENois Lab",
        description: null,
        htmlUrl: "https://github.com/enois-lab",
      },
    ]);
    mocks.orgRepos.mockReset().mockResolvedValue([repo("alfa"), repo("beta")]);
    mocks.importOrg.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <GithubOrgImport open onOpenChange={() => {}} username="ada" />
        </QueryClientProvider>,
      ),
    );
    await settle();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("passes the orgs and the chosen repos to the dialog", async () => {
    expect(mocks.orgRepos).toHaveBeenCalledWith("enois-lab");
    expect(dialog().title).toBe("Organizações");
    expect(dialog().orgs.items.map((org) => org.login)).toEqual(["enois-lab"]);
    expect(dialog().selectedOrg).toBe("enois-lab");
    expect(dialog().activeOrg?.login).toBe("enois-lab");
    expect(dialog().repos.rows.map((row) => row.fullName)).toEqual([
      "enois-lab/alfa",
      "enois-lab/beta",
    ]);
    expect(dialog().selected).toEqual([]);
  });

  it("imports only what was picked", async () => {
    mocks.importOrg.mockResolvedValue({ slug: "enois-lab", name: "ENois Lab", created: 1 });
    await act(async () => dialog().onToggle("enois-lab/alfa"));
    expect(dialog().selected).toEqual(["enois-lab/alfa"]);

    await act(async () => dialog().onImport());
    await settle();

    expect(mocks.importOrg).toHaveBeenCalledWith("enois-lab", ["enois-lab/alfa"]);
    expect(mocks.toast).toHaveBeenCalledWith(
      "ENois Lab: 1 projeto importado.",
      "success",
      expect.objectContaining({ label: "Abrir empresa" }),
    );
  });

  it("marks every repo with select all and clears them", async () => {
    await act(async () => dialog().onSelectAll());
    expect(dialog().selected).toEqual(["enois-lab/alfa", "enois-lab/beta"]);
    await act(async () => dialog().onClear());
    expect(dialog().selected).toEqual([]);

    await act(async () => dialog().onSelectAll());
    await act(async () => dialog().onImport());
    await settle();
    expect(mocks.importOrg).toHaveBeenCalledWith("enois-lab", ["enois-lab/alfa", "enois-lab/beta"]);
  });

  it("surfaces the server reason when the import is refused", async () => {
    mocks.importOrg.mockRejectedValue(new ApiError(403, "ORG_NAO_MEMBRO", "Você não é membro."));
    await act(async () => dialog().onSelectAll());
    await act(async () => dialog().onImport());
    await settle();
    expect(mocks.toast).toHaveBeenCalledWith("Você não é membro.", "error");
  });

  it("renders nothing when the GitHub link has no organization", async () => {
    await act(async () => root.unmount());
    client.clear();
    mocks.orgs.mockReset().mockResolvedValue([]);
    mocks.dialog = null;
    root = createRoot(host);
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <GithubOrgImport open onOpenChange={() => {}} username="ada" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    expect(mocks.dialog).toBeNull();
  });
});
