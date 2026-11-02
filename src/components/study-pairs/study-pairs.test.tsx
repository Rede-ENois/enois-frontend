// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MyStudyPairs } from "@/types/application/study-pairs/my-study-pairs";
import type { StudyPairsViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { StudyPairs } from "./study-pairs";

const mocks = vi.hoisted(() => ({
  props: null as null | StudyPairsViewProps,
  toast: vi.fn(),
  prefs: { getPersonalization: vi.fn(), setPersonalization: vi.fn() },
  api: {
    me: vi.fn(),
    popularGoals: vi.fn(),
    search: vi.fn(),
    request: vi.fn(),
    cancelRequest: vi.fn(),
    checkin: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("@rede-enois/design-system/domain", () => ({
  StudyPairsView: (props: StudyPairsViewProps) => {
    mocks.props = props;
    return null;
  },
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock("@/lib/api", () => ({ studyPairsApi: mocks.api, preferencesApi: mocks.prefs }));

const me: MyStudyPairs = {
  openRequest: null,
  pairs: [
    {
      id: "sp_1",
      goal: "Aprender Rust",
      goalKey: "aprender-rust",
      topic: null,
      startedAt: "2026-10-02T15:00:00Z",
      weekKey: "2026-W44",
      partner: { id: "partner", username: "ada", name: "Ada", avatar: null },
      myCheckinThisWeek: false,
      partnerCheckinThisWeek: false,
      checkins: [],
    },
  ],
};

describe("StudyPairs container", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));
  const props = () => mocks.props!;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.toast.mockReset();
    Object.values(mocks.api).forEach((fn) => fn.mockReset());
    Object.values(mocks.prefs).forEach((fn) => fn.mockReset());
    mocks.api.me.mockResolvedValue(me);
    mocks.api.popularGoals.mockResolvedValue({
      items: [{ goalKey: "sql", goal: "SQL", topic: "DADOS", openRequests: 2 }],
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <StudyPairs />
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

  it("maps the API data and the profile/security links", () => {
    expect(props().loading).toBe(false);
    expect(props().pairs[0]).toMatchObject({
      id: "sp_1",
      myCheckin: null,
      partner: { href: "/perfil/ada" },
    });
    expect(props().popularGoals).toHaveLength(1);
    expect(props().birthDateHref).toBe("/perfil");
    expect(props().verifyEmailHref).toBe("/seguranca");
    expect(props().topics?.length).toBeGreaterThan(0);
  });

  it("explains a refused request with its backend code", async () => {
    mocks.api.request.mockRejectedValue(new ApiError(403, "BIRTH_DATE_REQUIRED", "x"));

    await act(async () => props().onRequest({ goal: "  Aprender Go ", topic: null }));
    await settle();

    expect(mocks.api.request).toHaveBeenCalledWith("Aprender Go", null);
    expect(props().requestError).toBe("BIRTH_DATE_REQUIRED");
  });

  it("offers to turn the module back on, without retrying the request", async () => {
    mocks.api.request.mockRejectedValue(new ApiError(409, "STUDY_PAIRS_DISABLED", "x"));
    mocks.prefs.getPersonalization.mockResolvedValue({
      disabledModules: ["JOBS", "STUDY_PAIRS"],
    });
    mocks.prefs.setPersonalization.mockResolvedValue({});

    await act(async () => props().onRequest({ goal: "Aprender Go", topic: null }));
    await settle();
    expect(props().requestError).toBe("STUDY_PAIRS_DISABLED");

    const action = props().errorAction as React.ReactElement<{ onClick: () => void }>;
    await act(async () => action.props.onClick());
    await settle();

    expect(mocks.prefs.setPersonalization).toHaveBeenCalledWith({ disabledModules: ["JOBS"] });
    expect(props().requestError).toBeNull();
    expect(props().errorAction).toBeUndefined();
    expect(mocks.api.request).toHaveBeenCalledTimes(1);
  });

  it("tracks the check-in save per pair and refetches on success", async () => {
    mocks.api.checkin.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("offline"));

    await act(async () => props().onSaveCheckin("sp_1", ""));
    await settle();
    expect(mocks.api.checkin).toHaveBeenCalledWith("sp_1", "");
    expect(props().checkinStatus?.sp_1).toBe("saved");
    expect(mocks.api.me).toHaveBeenCalledTimes(2);

    await act(async () => props().onSaveCheckin("sp_1", "Capítulo 5"));
    await settle();
    expect(props().checkinStatus?.sp_1).toBe("error");
  });

  it("searches open goals by text and requests the chosen one", async () => {
    mocks.api.search.mockResolvedValue({
      items: [{ goal: "Aprender Rust", topic: null, createdAt: "2026-10-30T12:00:00Z" }],
    });

    const search = host.querySelector('input[type="search"]') as HTMLInputElement;
    const type = (value: string) => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(search) as object, "value")!.set!.call(
        search,
        value,
      );
      search.dispatchEvent(new Event("input", { bubbles: true }));
    };

    // Menos de 2 letras não consulta: não vale gastar request com uma letra.
    await act(async () => type("r"));
    await act(async () => new Promise<void>((done) => setTimeout(done, 350)));
    expect(mocks.api.search).not.toHaveBeenCalled();

    await act(async () => type("rust"));
    await act(async () => new Promise<void>((done) => setTimeout(done, 350)));
    await settle();
    expect(mocks.api.search).toHaveBeenCalledWith("rust");

    const chip = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === texts.studyPairs.search.action,
    );
    await act(async () => chip!.click());
    await settle();

    expect(mocks.api.request).toHaveBeenCalledWith("Aprender Rust", null);
  });

  it("warns when ending a pair fails", async () => {
    mocks.api.end.mockRejectedValue(new Error("offline"));

    await act(async () => props().onEndPair("sp_1"));
    await settle();

    expect(mocks.toast).toHaveBeenCalledWith(expect.any(String), "error");
    expect(props().endingPairId).toBeNull();
  });
});
