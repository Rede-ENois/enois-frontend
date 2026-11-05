// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reportable: vi.fn(),
  report: vi.fn(),
  upload: vi.fn(),
  capture: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  REPORT_REASONS: ["HARASSMENT", "SPAM", "OTHER"],
  callsApi: { reportable: mocks.reportable, report: mocks.report },
}));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ upload: mocks.upload, status: "idle", progress: 0 }),
}));
vi.mock("@/lib/calls/call-capture", () => ({
  requestCallCapture: mocks.capture,
  captureToFile: () => new File(["x"], "captura-da-chamada.jpg", { type: "image/jpeg" }),
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />,
  CharCounter: () => null,
  Label: (props: React.ComponentProps<"label">) => <label {...props} />,
  Textarea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({ toast: mocks.toast }),
}));

const { CallReportDialog } = await import("./call-report-dialog");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("denúncia de chamada", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const button = (text: string) =>
    [...host.querySelectorAll("button")].find((item) => item.textContent === text)!;

  const render = async (open = true) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <CallReportDialog
            callId="call_1"
            frameRef={{ current: null }}
            open={open}
            onOpenChange={() => undefined}
          />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    mocks.reportable.mockResolvedValue([
      { userId: "user_b", displayName: "Bia" },
      { userId: "user_c", displayName: "Caio" },
    ]);
    mocks.report.mockResolvedValue({ id: "report_1", status: "PENDING" });
    mocks.upload.mockResolvedValue({ mediaId: "media_1", cdnUrl: "https://cdn/x.jpg" });
    mocks.capture.mockResolvedValue("data:image/jpeg;base64,AAAA");
    host = document.createElement("div");
    document.body.append(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("mostra quem estava na chamada e a captura do momento", async () => {
    await render();
    expect(host.textContent).toContain("Bia");
    expect(host.textContent).toContain("Caio");
    expect(host.querySelector("img")?.getAttribute("src")).toBe("data:image/jpeg;base64,AAAA");
  });

  it("envia a captura como prova e a denúncia com quem foi apontado", async () => {
    await render();
    act(() => button("Enviar denúncia").click());
    await settle();

    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), "REPORT_CAPTURE");
    expect(mocks.report).toHaveBeenCalledWith("call_1", {
      reportedUserId: "user_b",
      reason: "HARASSMENT",
      description: "",
      mediaId: "media_1",
    });
    expect(mocks.toast).toHaveBeenCalled();
  });

  it("sala sem imagem legível manda a denúncia só com o relato", async () => {
    mocks.capture.mockResolvedValue(null);
    await render();
    expect(host.textContent).toContain("A denúncia segue só com o relato");

    act(() => button("Enviar denúncia").click());
    await settle();

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.report).toHaveBeenCalledWith("call_1", expect.objectContaining({ mediaId: null }));
  });

  it("ninguém além de quem denuncia na sala: não há quem apontar", async () => {
    mocks.reportable.mockResolvedValue([]);
    await render();
    expect(host.textContent).toContain("Ninguém além de você entrou nesta chamada");
    expect(button("Enviar denúncia").disabled).toBe(true);
  });
});
