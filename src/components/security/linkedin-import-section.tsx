import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import { LinkedinImportSection as LinkedinImportSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { preferencesApi, profileApi, projectsApi, resumeImportApi } from "@/lib/api";

import { LinkedinContactsSection } from "./linkedin-contacts-section";

/**
 * Importar o ARQUIVO DE DADOS do LinkedIn (Configurações → "Obter uma cópia dos seus
 * dados" → ZIP). O backend parseia e DEVOLVE o retrato; nada é salvo automaticamente —
 * a pessoa marca o que quer e o app cria experiencias, formação, certificações e
 * projetos pelos endpoints normais.
 */
/** Teto do perfil por seção (ProfileExtensionService.MAX_ENTRIES_PER_KIND). */
const LIMITE_POR_SECAO = 10;

/** Teto de projetos do perfil (ProjectsService.MAX_PROJECTS). */
const LIMITE_PROJETOS = 20;

/** Índice por chave da reimportação: a primeira entrada de cada chave vence. */
function indexBy<T extends { id: string }>(
  items: T[],
  keysOf: (item: T) => Array<string | null | undefined>,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    for (const key of keysOf(item)) {
      if (key && !index.has(key)) index.set(key, item);
    }
  }
  return index;
}

export function LinkedinImportSection({
  linkedinConectado = false,
}: {
  linkedinConectado?: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [preview, setPreview] = useState<LinkedinImportPreview | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [colando, setColando] = useState(false);

  const aplicarPreview = (novo: LinkedinImportPreview) => {
    setPreview(novo);
    setSelected({
      ...Object.fromEntries(novo.experiences.map((_, i) => [`exp${i}`, true])),
      ...Object.fromEntries(novo.education.map((_, i) => [`edu${i}`, true])),
      ...Object.fromEntries(novo.certifications.map((_, i) => [`cert${i}`, true])),
      ...Object.fromEntries(novo.projects.map((_, i) => [`proj${i}`, true])),
      ...(novo.profile ? { perfil: true } : {}),
      ...(novo.skills?.length ? { skills: true } : {}),
    });
  };

  const importar = useMutation({
    mutationFn: (file: File) => preferencesApi.importLinkedinArchive(file),
    onSuccess: aplicarPreview,
    onError: (error) => toast(error.message, "error"),
  });

  // O caminho SEM ARQUIVO: o texto do perfil colado direto (Ctrl+A/Ctrl+C no LinkedIn).
  const importarTexto = useMutation({
    mutationFn: (colado: string) => preferencesApi.importLinkedinText(colado),
    onSuccess: (novo) => {
      aplicarPreview(novo);
      setColando(false);
    },
    onError: (error) => toast(error.message, "error"),
  });

  // O caminho VIA CURRÍCULO: a pessoa sobe o PDF (ou .txt/.md) e recebe o retrato no MESMO
  // formato do LinkedIn — a revisão e o salvamento abaixo são compartilhados, sem tela nova.
  const importarCurriculo = useMutation({
    mutationFn: (file: File) => resumeImportApi.importResume(file),
    onSuccess: aplicarPreview,
    onError: (error) => toast(error.message, "error"),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!preview) return { created: 0, updated: 0, truncated: false };

      // Reimportar é SINCRONIZAR: o que já está no perfil é ATUALIZADO (descrição, período,
      // local), não duplicado. Título+empresa é a chave principal; empresa (escola/emissor) +
      // data de início cobre o caso de a pessoa ter corrigido um dos nomes no LinkedIn.
      const [experiences, education, certifications, projects] = await Promise.all([
        profileApi.experiences.list(),
        profileApi.education.list(),
        profileApi.certifications.list(),
        projectsApi.mine(),
      ]);
      const normalizar = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
      const chave = (...parts: (string | null | undefined)[]) => parts.map(normalizar).join("|");
      const comData = (nome?: string | null, data?: string | null) =>
        nome && data ? chave(nome, data) : null;

      const existentes = {
        experiences: indexBy(experiences, (item) => [
          chave(item.title, item.company),
          comData(item.company, item.startDate),
        ]),
        education: indexBy(education, (item) => [
          chave(item.school, item.degree),
          comData(item.school, item.startDate),
        ]),
        certifications: indexBy(certifications, (item) => [
          normalizar(item.name),
          comData(item.issuer, item.issueDate),
        ]),
        projects: indexBy(projects, (item) => [
          normalizar(item.title),
          item.repoUrl ? normalizar(item.repoUrl) : null,
        ]),
      };

      // Os tetos do perfil (10 por seção; 20 projetos) valem para o que é NOVO — atualizar o
      // que já existe não ocupa vaga.
      const vagas = (usados: number, teto: number) => Math.max(0, teto - usados);
      const limite = {
        experiences: vagas(experiences.length, LIMITE_POR_SECAO),
        education: vagas(education.length, LIMITE_POR_SECAO),
        certifications: vagas(certifications.length, LIMITE_POR_SECAO),
        projects: vagas(projects.length, LIMITE_PROJETOS),
      };
      let truncated = false;
      let created = 0;
      let updated = 0;

      const saves: Promise<unknown>[] = [];

      preview.experiences.forEach((exp, i) => {
        if (!selected[`exp${i}`]) return;
        const atual =
          existentes.experiences.get(chave(exp.title, exp.company)) ??
          existentes.experiences.get(comData(exp.company, exp.startDate) ?? "");
        const payload = {
          title: exp.title ?? atual?.title ?? "",
          company: exp.company ?? atual?.company ?? "",
          location: exp.location ?? atual?.location ?? null,
          description: exp.description ?? atual?.description ?? null,
          startDate: exp.startDate ?? atual?.startDate ?? null,
          // "atual" no arquivo manda: não herda um fim antigo de importação anterior.
          endDate: exp.currentlyHere ? null : (exp.endDate ?? atual?.endDate ?? null),
        };
        if (atual) {
          updated++;
          saves.push(profileApi.experiences.update(atual.id, payload));
          return;
        }
        if (limite.experiences <= 0) return void (truncated = true);
        limite.experiences--;
        created++;
        saves.push(profileApi.experiences.create(payload));
      });

      preview.education.forEach((edu, i) => {
        if (!selected[`edu${i}`]) return;
        const atual =
          existentes.education.get(chave(edu.school, edu.degree)) ??
          existentes.education.get(comData(edu.school, edu.startDate) ?? "");
        const payload = {
          school: edu.school ?? atual?.school ?? "",
          degree: edu.degree ?? atual?.degree ?? "",
          field: edu.field ?? atual?.field ?? "",
          description: edu.description ?? atual?.description ?? null,
          startDate: edu.startDate ?? atual?.startDate ?? null,
          endDate: edu.currentlyHere ? null : (edu.endDate ?? atual?.endDate ?? null),
        };
        if (atual) {
          updated++;
          saves.push(profileApi.education.update(atual.id, payload));
          return;
        }
        if (limite.education <= 0) return void (truncated = true);
        limite.education--;
        created++;
        saves.push(profileApi.education.create(payload));
      });

      preview.certifications.forEach((cert, i) => {
        if (!selected[`cert${i}`]) return;
        const atual = existentes.certifications.get(normalizar(cert.name));
        const payload = {
          name: cert.name,
          issuer: cert.issuer ?? atual?.issuer ?? "",
          description: atual?.description ?? null,
          issueDate: cert.issueDate ?? atual?.issueDate ?? null,
          expirationDate: atual?.expirationDate ?? null,
          credentialUrl: atual?.credentialUrl ?? null,
        };
        if (atual) {
          updated++;
          saves.push(profileApi.certifications.update(atual.id, payload));
          return;
        }
        if (limite.certifications <= 0) return void (truncated = true);
        limite.certifications--;
        created++;
        saves.push(profileApi.certifications.create(payload));
      });

      preview.projects.forEach((project, i) => {
        if (!selected[`proj${i}`]) return;
        const atual = existentes.projects.get(normalizar(project.title));
        // O card de projeto não tem campo de descrição: o texto do LinkedIn entra como a
        // PRIMEIRA entrada do diário. Sem descrição no arquivo, o diário existente fica como está.
        const diary = project.description
          ? [
              {
                date: project.startDate ?? new Date().toISOString().slice(0, 10),
                text: project.description.slice(0, 2_000),
              },
            ]
          : undefined;
        const payload = {
          title: project.title ?? atual?.title ?? "",
          description: project.description?.slice(0, 500) ?? atual?.description ?? null,
          stack: atual?.stack ?? [],
          repoUrl: project.url ?? atual?.repoUrl ?? null,
          status: atual?.status ?? null,
          diary: diary ?? atual?.diary ?? [],
          html: atual?.html ?? null,
        };
        if (atual) {
          updated++;
          saves.push(projectsApi.update(atual.id, payload));
          return;
        }
        if (limite.projects <= 0) return void (truncated = true);
        limite.projects--;
        created++;
        saves.push(projectsApi.create(payload));
      });

      // Perfil: os campos do Profile.csv e as skills entram num update único (parcial).
      if (preview.profile && selected.perfil) {
        const campos: Record<string, unknown> = {};
        if (preview.profile.headline) campos.headline = preview.profile.headline;
        if (preview.profile.location) campos.location = preview.profile.location;
        if (preview.profile.summary) campos.bio = preview.profile.summary.slice(0, 2_000);
        if (Object.keys(campos).length > 0) {
          saves.push(profileApi.update(campos));
        }
      }
      if (preview.skills?.length && selected.skills) {
        saves.push(profileApi.update({ skills: preview.skills.slice(0, 50) }));
      }
      await Promise.all(saves);
      return { created, updated, truncated };
    },
    onSuccess: ({ created, updated, truncated }) => {
      if (created === 0 && updated === 0) {
        toast(texts.account.linkedinImport.nothingNew, "success");
      } else {
        toast(
          texts.account.linkedinImport.done(created, updated) +
            (truncated ? ` ${texts.account.linkedinImport.capReached}` : ""),
          "success",
        );
      }
      setPreview(null);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (error) => toast(error.message, "error"),
  });

  const toggle = (key: string) => setSelected((current) => ({ ...current, [key]: !current[key] }));

  return (
    <LinkedinImportSectionView
      linkedinConnected={linkedinConectado}
      // Contatos: o mesmo arquivo de dados traz o Connections.csv, e daí sai o convite
      // automático para quem já tem conta no Énóis. Só faz sentido com o LinkedIn vinculado.
      contactsSection={linkedinConectado ? <LinkedinContactsSection /> : undefined}
      preview={preview}
      selected={selected}
      onToggle={toggle}
      pasteOpen={colando}
      onPasteOpenChange={setColando}
      onImportArchive={(file) => importar.mutate(file)}
      archivePending={importar.isPending}
      onImportText={(colado) => importarTexto.mutate(colado)}
      textPending={importarTexto.isPending}
      onImportResume={(file) => importarCurriculo.mutate(file)}
      resumePending={importarCurriculo.isPending}
      onSave={() => salvar.mutate()}
      savePending={salvar.isPending}
      onCancelPreview={() => setPreview(null)}
    />
  );
}
