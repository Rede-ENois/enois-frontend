// @vitest-environment jsdom
import { act, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileDialogProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditProfileDialog } from "./edit-profile-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ me: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/api", () => {
  const lista = { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  return {
    ApiError: class extends Error {},
    preferencesApi: { setBadges: vi.fn() },
    profileApi: {
      me: mocks.me,
      update: mocks.update,
      setRanking: vi.fn(),
      experiences: lista,
      education: lista,
      certifications: lista,
    },
  };
});
vi.mock("@/lib/session", () => ({ hasSessionFlag: () => true }));
vi.mock("@/lib/use-media-upload", () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ navigate: vi.fn() }) }));
vi.mock("./badge-media-provider", () => ({
  BadgeMediaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Fiel ao diálogo do design system: o campo só lê o perfil ao montar e o salvar devolve o valor do
// formulário, com o erro (quando há) mostrado na tela. O que está sob teste é o que o app entrega.
vi.mock("@rede-enois/design-system/domain", () => ({
  profileBadges: () => [],
  EditProfileDialog: function View({ profile, onSave }: EditProfileDialogProps) {
    const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
    const [erro, setErro] = useState("");
    return (
      <div>
        <input
          aria-label="nascimento"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
        />

        <button
          type="button"
          onClick={async () => {
            const falha = await onSave({
              username: profile.username,
              name: profile.name,
              headline: "",
              bio: "",
              company: "",
              location: "",
              birthDate,
              availability: "",
              portfolio: "",
              linksText: "",
              skillsText: "",
              goalsText: "",
              openToWork: false,
              isMentor: false,
              showRanking: true,
              aka: "",
              badges: [],
            });
            setErro(falha?.message ?? "");
          }}
        >
          Salvar
        </button>

        <p role="alert">{erro}</p>
      </div>
    );
  },
}));

// O perfil público nunca traz a data: é o que a página entrega ao diálogo.
const perfilPublico = {
  id: "user-1",
  username: "pessoa-teste",
  name: "Pessoa Teste",
  openToWork: false,
  isMentor: false,
} as Profile;

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

/** Monta e espera /me responder: é a resposta que recria o formulário com a data da conta. */
async function montar() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <EditProfileDialog profile={perfilPublico}>
          <button type="button">Editar</button>
        </EditProfileDialog>
      </QueryClientProvider>,
    );
  });
  const esperar = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  const fim = Date.now() + 2_000;
  while (client.getQueryState(["me"])?.status !== "success" && Date.now() < fim) {
    await esperar();
  }
  // A consulta avisa os componentes no tick seguinte: só então a tela tem a resposta.
  await esperar();
}

function campo() {
  return document.querySelector<HTMLInputElement>('input[aria-label="nascimento"]');
}

async function digitar(valor: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  await act(async () => {
    setter?.call(campo(), valor);
    campo()?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function salvar() {
  await act(async () => {
    [...document.querySelectorAll("button")].find((b) => b.textContent === "Salvar")?.click();
  });
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.update.mockReset().mockResolvedValue(perfilPublico);
  mocks.me.mockReset().mockResolvedValue({ ...perfilPublico, birthDate: "1990-05-10" });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Data de nascimento na edição do perfil", () => {
  it("mostra a data que está na conta, embora o perfil público não a traga", async () => {
    await montar();

    expect(campo()?.value).toBe("1990-05-10");
  });

  it("continua lá ao sair da página e voltar", async () => {
    await montar();
    act(() => root.unmount());

    root = createRoot(host);
    await montar();

    expect(campo()?.value).toBe("1990-05-10");
  });

  it("não reenvia a data quando ela não mudou", async () => {
    await montar();

    await salvar();

    expect(mocks.update.mock.calls[0]?.[0].birthDate).toBeUndefined();
  });

  it("envia a data quando ela muda", async () => {
    await montar();

    await digitar("1991-02-03");
    await salvar();

    expect(mocks.update.mock.calls[0]?.[0].birthDate).toBe("1991-02-03");
  });

  it("menor de idade com a data já na conta consegue salvar o resto do perfil", async () => {
    mocks.me.mockResolvedValue({ ...perfilPublico, birthDate: "2015-01-01" });
    await montar();
    expect(campo()?.value).toBe("2015-01-01");

    await salvar();

    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("data nova de menor de idade continua recusada", async () => {
    await montar();

    await digitar("2015-01-01");
    await salvar();

    expect(mocks.update).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(texts.profile.edit.birthDateInvalid);
  });
});
