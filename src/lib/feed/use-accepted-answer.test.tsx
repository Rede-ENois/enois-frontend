// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { UseAcceptedAnswerResult } from "@/types/lib/feed/use-accepted-answer-result";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAcceptedAnswer } from "./use-accepted-answer";

const mocks = vi.hoisted(() => ({
  acceptAnswer: vi.fn(),
  unacceptAnswer: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ feedApi: mocks }));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));

const question = { id: "q1", type: "QUESTION", acceptedCommentId: null, resolved: false };

describe("useAcceptedAnswer", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;
  let result: UseAcceptedAnswerResult;

  function Probe({ serverAcceptedId }: { serverAcceptedId: string | null }) {
    result = useAcceptedAnswer("q1", serverAcceptedId);
    return null;
  }

  const render = (serverAcceptedId: string | null) =>
    act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe serverAcceptedId={serverAcceptedId} />
        </QueryClientProvider>,
      ),
    );

  const cachedPost = () => client.getQueryData<PostView>(["post", "q1"]);

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient();
    client.setQueryData(["post", "q1"], question);
    await render(null);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("accepts optimistically and keeps the server answer", async () => {
    let resolve!: (value: unknown) => void;
    mocks.acceptAnswer.mockReturnValue(new Promise((fulfill) => (resolve = fulfill)));

    await act(async () => result.accept("c1"));
    expect(result.acceptedId).toBe("c1");
    expect(result.pending).toBe(true);
    expect(cachedPost()).toMatchObject({ acceptedCommentId: "c1", resolved: true });

    await act(async () => resolve({ postId: "q1", acceptedCommentId: "c1", resolved: true }));
    expect(mocks.acceptAnswer).toHaveBeenCalledWith("q1", "c1");
    expect(result.pending).toBe(false);
    expect(result.acceptedId).toBe("c1");
  });

  it("rolls back to the previous answer and warns when the API refuses", async () => {
    await render("c0");
    mocks.acceptAnswer.mockRejectedValue(new Error("OWN_ANSWER"));

    await act(async () => result.accept("c1"));

    expect(result.acceptedId).toBe("c0");
    expect(cachedPost()).toMatchObject({ acceptedCommentId: "c0", resolved: true });
    expect(mocks.toast).toHaveBeenCalledWith(expect.any(String), "error");
  });

  it("unaccepts and reopens the question", async () => {
    await render("c1");
    mocks.unacceptAnswer.mockResolvedValue({
      postId: "q1",
      acceptedCommentId: null,
      resolved: false,
    });

    await act(async () => result.unaccept());

    expect(mocks.unacceptAnswer).toHaveBeenCalledWith("q1");
    expect(result.acceptedId).toBeNull();
    expect(cachedPost()).toMatchObject({ acceptedCommentId: null, resolved: false });
  });

  it("reopens locally when the accepted comment is deleted", async () => {
    await render("c1");

    await act(async () => result.commentDeleted("c2"));
    expect(result.acceptedId).toBe("c1");

    await act(async () => result.commentDeleted("c1"));
    expect(result.acceptedId).toBeNull();
    expect(cachedPost()).toMatchObject({ resolved: false });
  });
});
