// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/lib/api";

import { EmailOtpSection } from "./seguranca";

vi.mock("@/lib/api", () => ({
  authApi: { requestEmailOtp: vi.fn(), confirmEmailOtp: vi.fn() },
}));

let host: HTMLDivElement;
let root: Root;
let client: QueryClient;
const onDone = vi.fn();

function button(label: string) {
  return [...host.querySelectorAll("button")].find((node) => node.textContent === label)!;
}

async function typeCode(value: string) {
  const input = host.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return input;
}

beforeEach(async () => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.mocked(authApi.requestEmailOtp).mockResolvedValue({ status: "ok" });
  vi.mocked(authApi.confirmEmailOtp).mockResolvedValue({ status: "ok" });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <EmailOtpSection
          status={{
            emailVerified: true,
            emailOtpEnabled: false,
            totpEnabled: false,
            providerSecondFactor: false,
            twoFactorEnabled: false,
            identityVerified: false,
            backupCodesLeft: 0,
            totpAvailable: true,
          }}
          onError={vi.fn()}
          onDone={onDone}
        />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    button(texts.auth.twoFactor.email2faEnable).click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  host.remove();
});

describe("ativação do código por e-mail", () => {
  it("exige seis dígitos, sem aviso de limite, e envia o código com zero inicial", async () => {
    const confirm = () => button(texts.auth.twoFactor.email2faConfirm);
    expect(confirm().disabled).toBe(true);
    await typeCode("01234");
    expect(confirm().disabled).toBe(true);
    const input = await typeCode("012345");
    expect(confirm().disabled).toBe(false);
    expect(input.maxLength).toBe(6);
    expect(input.autocomplete).toBe("one-time-code");
    expect(input.parentElement!.querySelector("[aria-live]")).toBeNull();
    expect(host.textContent).not.toContain("6 / 6");
    await act(async () => {
      confirm().click();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(authApi.confirmEmailOtp).toHaveBeenCalledWith("012345");
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("remove letras digitadas e desabilita a confirmação ao apagar um dígito", async () => {
    expect((await typeCode("12a34b")).value).toBe("1234");
    expect(button(texts.auth.twoFactor.email2faConfirm).disabled).toBe(true);
    expect((await typeCode("1234567")).value).toBe("123456");
    expect(button(texts.auth.twoFactor.email2faConfirm).disabled).toBe(false);
    await typeCode("12345");
    expect(button(texts.auth.twoFactor.email2faConfirm).disabled).toBe(true);
  });

  it("normaliza a colagem antes de limitar a seis dígitos", async () => {
    const input = host.querySelector("input")!;
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => " 01 23 45 67\n" },
    });
    await act(async () => {
      input.dispatchEvent(event);
    });
    expect(input.value).toBe("012345");
    expect(event.defaultPrevented).toBe(true);
    expect(button(texts.auth.twoFactor.email2faConfirm).disabled).toBe(false);
  });
});
