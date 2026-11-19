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
}));

vi.mock("@rede-enois/design-system/ui", () => ({
  Button: ({ children, ...props }: { children?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
  Pill: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Dialog: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ toast: mocks.toast }),
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
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find((item) => item.textContent === label)!;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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

  it("lists the org repos and imports only what was picked", async () => {
    expect(host.textContent).toContain("Organizações");
    expect(mocks.orgRepos).toHaveBeenCalledWith("enois-lab");
    expect(button("Importar 0 projetos").hasAttribute("disabled")).toBe(true);

    await act(async () =>
      host.querySelector<HTMLInputElement>('[aria-label="enois-lab/alfa"]')!.click(),
    );
    expect(host.textContent).toContain("Importar 1 projeto");

    mocks.importOrg.mockResolvedValue({ slug: "enois-lab", name: "ENois Lab", created: 1 });
    await act(async () => button("Importar 1 projeto").click());
    await settle();

    expect(mocks.importOrg).toHaveBeenCalledWith("enois-lab", ["enois-lab/alfa"]);
    expect(mocks.toast).toHaveBeenCalledWith(
      "ENois Lab: 1 projeto importado.",
      "success",
      expect.objectContaining({ label: "Abrir empresa" }),
    );
  });

  it("marks every repo with the select-all button", async () => {
    await act(async () => button("Marcar todos").click());
    await act(async () => button("Importar 2 projetos").click());
    await settle();
    expect(mocks.importOrg).toHaveBeenCalledWith("enois-lab", ["enois-lab/alfa", "enois-lab/beta"]);
  });

  it("surfaces the server reason when the import is refused", async () => {
    mocks.importOrg.mockRejectedValue(new ApiError(403, "ORG_NAO_MEMBRO", "Você não é membro."));
    await act(async () => button("Marcar todos").click());
    await act(async () => button("Importar 2 projetos").click());
    await settle();
    expect(mocks.toast).toHaveBeenCalledWith("Você não é membro.", "error");
  });

  it("renders nothing when the GitHub link has no organization", async () => {
    mocks.orgs.mockResolvedValue([]);
    await act(async () => {
      await client.invalidateQueries();
    });
    await settle();
    expect(host.textContent).toBe("");
  });
});
