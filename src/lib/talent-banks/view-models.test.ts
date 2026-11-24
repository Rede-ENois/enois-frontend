import type { TalentBankCandidateDetail } from "@/types/application/talent-banks/talent-bank-candidate-detail";
import type { TalentBankMyEnrollment } from "@/types/application/talent-banks/talent-bank-my-enrollment";
import type { TalentBankSummary } from "@/types/application/talent-banks/talent-bank-summary";
import { describe, expect, it } from "vitest";

import { paraFicha, paraInscricaoDaPessoa, paraResumo } from "./view-models";

const catalogo = [
  { key: "PROFILE", label: "Perfil profissional", description: "Nome, @ e localização." },
  { key: "RESUME", label: "Currículo", description: "O PDF do perfil." },
];

const recrutador = {
  userId: "u-1",
  name: "Recrutadora",
  username: "recrutadora",
  avatar: null,
  headline: "Tech Recruiter",
  location: "São Paulo",
};

describe("paraResumo", () => {
  it("leva para a banca e mostra só os campos que a banca pede", () => {
    const banca: TalentBankSummary = {
      id: "b-1",
      title: "Banca de produto",
      purpose: "Encontrar gente de produto",
      focusArea: "Produto",
      desiredSkills: ["Discovery"],
      requestedFields: ["PROFILE", "SKILLS"],
      createdAt: "2026-11-01T10:00:00Z",
      recruiter: recrutador,
    };

    const resumo = paraResumo(banca, catalogo, "/bancos-de-talentos/b-1");

    expect(resumo.href).toBe("/bancos-de-talentos/b-1");
    expect(resumo.requestedFields.map((campo) => campo.key)).toEqual(["PROFILE"]);
    expect(resumo.recruiter.username).toBe("recrutadora");
  });
});

describe("paraFicha", () => {
  it("leva a certificação com a data de emissão e não inventa bloco não autorizado", () => {
    const ficha: TalentBankCandidateDetail = {
      enrollmentId: "e-1",
      state: "ACTIVE",
      sharedFields: ["PROFILE", "CERTIFICATIONS"],
      consentVersion: "2026-11",
      purposeSnapshot: "Seleção",
      note: null,
      consentedAt: "2026-11-10T12:00:00Z",
      identity: {
        name: "Pessoa",
        username: "pessoa",
        headline: null,
        avatar: null,
        location: null,
      },
      skills: [],
      experiences: [],
      educations: [],
      certifications: [
        {
          id: "c-1",
          name: "Scrum",
          issuer: "Scrum.org",
          description: null,
          issueDate: "2025-05-01",
          expirationDate: null,
          credentialUrl: null,
        },
      ],
      resumeAuthorized: false,
      resumeAvailable: false,
      resumeName: null,
    };

    const modelo = paraFicha(ficha);

    expect(modelo.certifications[0].issuedAt).toBe("2025-05-01");
    expect(modelo.identity?.username).toBe("pessoa");
    expect(modelo.resumeAuthorized).toBe(false);
  });
});

describe("paraInscricaoDaPessoa", () => {
  it("leva o estado e os campos autorizados da inscrição da própria pessoa", () => {
    const inscricao: TalentBankMyEnrollment = {
      enrollmentId: "e-2",
      bankId: "b-2",
      bankTitle: "Banca de dados",
      bankPurpose: "Formar um time",
      recruiterName: "Recrutador",
      recruiterUsername: "recrutador",
      state: "ACTIVE",
      sharedFields: ["PROFILE"],
      consentVersion: "2026-11",
      requestedAt: "2026-11-02T09:00:00Z",
      consentedAt: "2026-11-02T09:05:00Z",
      revokedAt: null,
      closedAt: null,
      updatedAt: "2026-11-02T09:05:00Z",
    };

    const modelo = paraInscricaoDaPessoa(inscricao);

    expect(modelo.id).toBe("e-2");
    expect(modelo.state).toBe("ACTIVE");
    expect(modelo.sharedFields).toEqual(["PROFILE"]);
    expect(modelo.revokedAt).toBeNull();
  });
});
