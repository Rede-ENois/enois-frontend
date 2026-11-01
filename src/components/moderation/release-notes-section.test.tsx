// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ReleaseNotesSection } from "./release-notes-section";

const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  editorItems: null as null | { title: string }[],
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  releaseNotesApi: { current: mocks.current, publish: vi.fn(), retire: vi.fn() },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ReleaseNotesEditor: (props: { items: { title: string }[] }) => {
    mocks.editorItems = props.items;
    return <p>editor</p>;
  },
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: (props: { children: React.ReactNode }) => <button>{props.children}</button>,
  EmptyState: (props: { title: string; children: React.ReactNode }) => (
    <div>
      <p>{props.title}</p>
      {props.children}
    </div>
  ),
  useToast: () => ({ toast: vi.fn() }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  mocks.current.mockReset();
  mocks.editorItems = null;
  host = document.createElement("div");
  root = createRoot(host);
});

afterEach(() => act(() => root.unmount()));

async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <ReleaseNotesSection />
      </QueryClientProvider>,
    ),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

it("keeps the form closed when what is on air cannot be read", async () => {
  mocks.current.mockRejectedValue(new Error("offline"));
  await render();

  expect(host.textContent).toContain(texts.moderator.releaseNotes.readErrorTitle);
  expect(host.textContent).not.toContain("editor");
});

it("seeds the form with the release on air", async () => {
  mocks.current.mockResolvedValue({
    id: "ativo",
    items: [{ title: "Par de estudo", description: "Estude junto." }],
    publishedAt: "2026-10-31T12:00:00Z",
    updatedAt: "2026-10-31T12:00:00Z",
  });
  await render();

  expect(mocks.editorItems?.map((item) => item.title)).toEqual(["Par de estudo"]);
});
