import type {
  ProfileAppearance,
  ProfileLook,
} from "@/types/application/profile/profile-appearance";
import { describe, expect, it } from "vitest";

import { resolveProfileLook } from "./profile-look";

function look(theme: string, accent: string | null = null): ProfileLook {
  return {
    theme,
    accent,
    font: null,
    header: null,
    textures: null,
    borders: null,
    decoration: null,
  };
}

function appearance(socialTheme: string, professionalTheme: string): ProfileAppearance {
  return {
    social: look(socialTheme),
    professional: look(professionalTheme),
  };
}

describe("resolveProfileLook", () => {
  it("mostra ao visitante o visual que o dono escolheu, e não o do visitante", () => {
    // Regressão: `["me"]` é a chave do `useCurrentUser()` e fica em cache para qualquer pessoa
    // logada. Sem o portão do dono, o visitante via a própria aparência no perfil alheio.
    const resolved = resolveProfileLook({
      isOwnProfile: false,
      preview: null,
      ownAppearance: appearance("tema-do-visitante", "profissional-do-visitante"),
      publicLook: look("tema-do-dono"),
    });

    expect(resolved).toEqual(look("tema-do-dono"));
  });

  it("ignora a aparência do visitante mesmo quando o perfil público não traz visual", () => {
    const resolved = resolveProfileLook({
      isOwnProfile: false,
      preview: null,
      ownAppearance: appearance("tema-do-visitante", "profissional-do-visitante"),
      publicLook: null,
    });

    expect(resolved).toBeNull();
  });

  it("não usa a prévia do diálogo quando o perfil não é do dono", () => {
    const resolved = resolveProfileLook({
      isOwnProfile: false,
      preview: appearance("prévia", "prévia"),
      ownAppearance: null,
      publicLook: look("tema-do-dono"),
    });

    expect(resolved).toEqual(look("tema-do-dono"));
  });

  it("no próprio perfil usa a aparência do dono e não o retrato público", () => {
    const resolved = resolveProfileLook({
      isOwnProfile: true,
      preview: null,
      ownAppearance: appearance("meu-tema", "meu-profissional"),
      publicLook: look("cache-velho"),
    });

    expect(resolved).toEqual(look("meu-tema"));
  });

  it("no próprio perfil a prévia do diálogo vence a aparência salva", () => {
    const resolved = resolveProfileLook({
      isOwnProfile: true,
      preview: appearance("prévia-nova", "x"),
      ownAppearance: appearance("salvo", "y"),
      publicLook: null,
    });

    expect(resolved).toEqual(look("prévia-nova"));
  });

  it("perfil próprio sem visual nenhum devolve null", () => {
    expect(
      resolveProfileLook({
        isOwnProfile: true,
        preview: null,
        ownAppearance: null,
        publicLook: null,
      }),
    ).toBeNull();
  });
});
