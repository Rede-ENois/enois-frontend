import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import {
  EditProfileDialog as EditProfileDialogView,
  type EditProfileListKind,
  type EditProfileSaveError,
  type EditProfileTab,
  type EditProfileValues,
  profileBadges,
} from "@rede-enois/design-system/domain";

import { ApiError, preferencesApi, profileApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { ISO_DATE, hasMinAge } from "@/lib/min-age";
import { profileQueries } from "@/lib/query-options/profiles";
import { useMediaUpload } from "@/lib/use-media-upload";

import { BadgeMediaProvider } from "./badge-media-provider";

/** Criar, editar e remover os itens de uma lista do perfil (o formulário manda os campos crus). */
function useListMutations<TData>(
  api: {
    create: (data: TData) => Promise<unknown>;
    update: (id: string, data: TData) => Promise<unknown>;
    delete: (id: string) => Promise<unknown>;
  },
  queryKey: string[],
) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    // O perfil público tem a própria query (por username): invalida para a seção
    // "Experiências" refletir a edição sem precisar recarregar a página.
    queryClient.invalidateQueries({ queryKey: ["experiences"] });
  };

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.create(data as TData),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.update(id, data as TData),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, pending: create.isPending || update.isPending };
}

export function EditProfileDialog({ profile: publicProfile, children }: Props) {
  // A página entrega o perfil público, que não traz a data de nascimento, de propósito: ela só
  // existe na projeção do dono (/me).
  const { data: me } = useCurrentUser();
  const profile = { ...publicProfile, birthDate: me?.birthDate };

  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<EditProfileTab>("info");
  const badgeUpload = useMediaUpload();

  const updateProfile = useMutation({
    mutationFn: (data: Parameters<typeof profileApi.update>[0]) => profileApi.update(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      queryClient.invalidateQueries({ queryKey: profileQueries.byId(profile.id).queryKey });
      if (updated.username && updated.username !== profile.username) {
        queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
        router.navigate({
          to: "/perfil/$username",
          params: { username: updated.username },
          replace: true,
        });
      }
      setOpen(false);
    },
  });

  const { data: experiences = [] } = useQuery({
    queryKey: ["me", "experiences"],
    queryFn: () => profileApi.experiences.list(),
    enabled: open && tab === "experiences",
  });

  const { data: education = [] } = useQuery({
    queryKey: ["me", "education"],
    queryFn: () => profileApi.education.list(),
    enabled: open && tab === "education",
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: () => profileApi.certifications.list(),
    enabled: open && tab === "certifications",
  });

  const lists = {
    experiences: useListMutations<ExperienceRequest>(profileApi.experiences, ["me", "experiences"]),
    education: useListMutations<EducationRequest>(profileApi.education, ["me", "education"]),
    certifications: useListMutations<CertificationRequest>(profileApi.certifications, [
      "me",
      "certifications",
    ]),
  };

  // Mesmo caminho do avatar na página de perfil: sobe pelo provedor que a API indicar (S3 ou
  // ImageKit) e guarda a URL — ela vai junto no salvar do diálogo, não em um PATCH próprio.
  const uploadBadge = async (file: File) => (await badgeUpload.upload(file, "BADGE")).cdnUrl;

  const handleSave = async (values: EditProfileValues): Promise<EditProfileSaveError | null> => {
    const { birthDate, badges, showRanking } = values;
    const birthDateChanged = birthDate !== (profile.birthDate ?? "");
    // Data nova precisa ser real e maior de idade — mesma régua do cadastro. A que já está na conta
    // não passa por aqui: quem é menor supervisionado não pode ficar sem salvar o resto do perfil.
    if (birthDateChanged && birthDate && (!ISO_DATE.test(birthDate) || !hasMinAge(birthDate))) {
      return { field: "general", message: texts.profile.edit.birthDateInvalid };
    }
    // Os emblemas vão por endpoint próprio (a lista de até 5 não passa pelo PUT do perfil) e antes
    // do resto: assim o perfil já volta com a lista nova. Lista vazia limpa todos.
    if (badges.join("\n") !== profileBadges(profile).join("\n")) {
      try {
        await preferencesApi.setBadges(badges);
      } catch (err) {
        return {
          field: "general",
          message: err instanceof ApiError ? err.message : texts.profile.imageUploadError,
        };
      }
    }
    if (showRanking !== (profile.showRanking !== false)) {
      try {
        await profileApi.setRanking(showRanking);
      } catch (err) {
        return {
          field: "general",
          message: err instanceof ApiError ? err.message : texts.errors.unexpected,
        };
      }
    }
    try {
      await updateProfile.mutateAsync({
        username: values.username !== profile.username ? values.username : undefined,
        // String vazia limpa (o servidor só preserva quando o campo vem ausente/null).
        aka: values.aka.trim(),
        name: values.name !== profile.name ? values.name : undefined,
        headline: values.headline || null,
        bio: values.bio || null,
        company: values.company || null,
        location: values.location || null,
        birthDate: birthDateChanged ? birthDate || null : undefined,
        // Apenas apagar o valor, nao alterava o campo. O servidor entende string vazia como "limpar", null como "preservar".
        // Desta forma, se o usuário apagar o campo, ele será removido do perfil de fato.
        availability:
          values.availability !== (profile.availability ?? "")
            ? values.availability === ""
              ? ""
              : values.availability
            : undefined,
        portfolio: values.portfolio || null,
        externalLinks: values.linksText
          ? values.linksText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        skills: values.skillsText
          ? values.skillsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        goals: values.goalsText
          ? values.goalsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        openToWork: values.openToWork,
        isMentor: values.isMentor,
      });
      return null;
    } catch (err) {
      // Mapear por CODIGO, nunca por status: um 409 tambem vem de outras validacoes (bio longa,
      // e-mail em uso, ...) e mostrar "nome de usuario ja esta em uso" para todas era o problema.
      if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
        return { field: "username", message: texts.profile.edit.usernameTaken };
      }
      return {
        field: "general",
        message: err instanceof ApiError ? err.message : texts.errors.unexpected,
      };
    }
  };

  return (
    <BadgeMediaProvider badges={profileBadges(profile)}>
      {/* O formulário só lê o perfil ao montar: recria uma vez quando /me chega, e não a cada nova
          resposta, que poderia chegar antes da do perfil público e trazer de volta campos antigos. */}
      <EditProfileDialogView
        key={me ? "com-me" : "sem-me"}
        profile={profile}
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        onTabChange={setTab}
        savePending={updateProfile.isPending}
        onSave={handleSave}
        onUploadBadge={uploadBadge}
        experiences={experiences}
        education={education}
        certifications={certifications}
        listPending={{
          experiences: lists.experiences.pending,
          education: lists.education.pending,
          certifications: lists.certifications.pending,
        }}
        onCreateItem={(kind: EditProfileListKind, data) => lists[kind].create.mutateAsync(data)}
        onUpdateItem={(kind, id, data) => lists[kind].update.mutateAsync({ id, data })}
        onDeleteItem={(kind, id) => lists[kind].remove.mutate(id)}
      >
        {children}
      </EditProfileDialogView>
    </BadgeMediaProvider>
  );
}
