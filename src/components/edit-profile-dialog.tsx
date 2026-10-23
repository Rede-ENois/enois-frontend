import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { MAX_BADGES } from "@/constants/badges";
import { texts } from "@/texts";
import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Education } from "@/types/application/profile/education";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Experience } from "@/types/application/profile/experience";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Profile } from "@/types/application/profile/profile";
import type { FieldProps } from "@/types/components/profile/edit-profile-dialog/field-props";
import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import type { SubListUpdate } from "@/types/components/profile/edit-profile-dialog/sub-list-update";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { ApiError, preferencesApi, profileApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { ISO_DATE, hasMinAge } from "@/lib/min-age";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { DateTextInput } from "@/components/ui/date-text-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * Os emblemas do perfil: a lista nova e, para quem ainda só tem o emblema antigo (campo único),
 * ele sozinho — a mesma leitura que a página de perfil faz. A primeira imagem é a que acompanha
 * o nome em todo o app.
 */
function badgesOf(profile: Profile) {
  if (profile.badges?.length) return profile.badges;
  return profile.badge ? [profile.badge] : [];
}

export function EditProfileDialog({ profile, children }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "experiences" | "education" | "certifications">("info");

  const [username, setUsername] = useState(profile.username);
  const [name, setName] = useState(profile.name);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [availability, setAvailability] = useState(profile.availability ?? "");
  const [portfolio, setPortfolio] = useState(profile.portfolio ?? "");
  const [linksText, setLinksText] = useState((profile.externalLinks ?? []).join("\n"));
  const [skillsText, setSkillsText] = useState((profile.skills ?? []).join(", "));
  const [goalsText, setGoalsText] = useState((profile.goals ?? []).join(", "));
  const [openToWork, setOpenToWork] = useState(profile.openToWork);
  const [isMentor, setIsMentor] = useState(profile.isMentor);
  // Ranking opcional (pedido via suporte): preferencia da CONTA, salva junto com o perfil.
  const [showRanking, setShowRanking] = useState(profile.showRanking !== false);
  const [aka, setAka] = useState(profile.aka ?? "");
  const [badges, setBadges] = useState<string[]>(badgesOf(profile));
  const [usernameError, setUsernameError] = useState("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const badgeUpload = useMediaUpload();
  const badgeRef = useRef<HTMLInputElement>(null);

  const updateProfile = useMutation({
    mutationFn: (data: Parameters<typeof profileApi.update>[0]) => profileApi.update(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
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
    onError: (err) => {
      // Mapear por CODIGO, nunca por status: um 409 tambem vem de outras validacoes (bio longa,
      // e-mail em uso, ...) e mostrar "nome de usuario ja esta em uso" para todas era o problema.
      if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
        setUsernameError(texts.profile.edit.usernameTaken);
        return;
      }
      setGeneralError(err instanceof ApiError ? err.message : texts.errors.unexpected);
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

  // Mesmo caminho do avatar na página de perfil: sobe pelo provedor que a API indicar (S3 ou
  // ImageKit) e guarda a URL — ela vai junto no salvar do diálogo, não em um PATCH próprio.
  const handleBadgeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpar o input: o navegador não dispara `change` para o MESMO arquivo escolhido duas vezes.
    event.target.value = "";
    if (!file) return;
    setGeneralError(null);
    if (badges.length >= MAX_BADGES) {
      setGeneralError(texts.profile.edit.badgesFull);
      return;
    }
    try {
      const result = await badgeUpload.upload(file, "BADGE");
      // Entra no fim da lista: a ordem é a que aparece no perfil, e a primeira acompanha o nome.
      setBadges((current) => [...current, result.cdnUrl]);
    } catch {
      setGeneralError(texts.profile.imageUploadError);
    }
  };

  const handleSave = async () => {
    setUsernameError("");
    setGeneralError(null);
    // Data preenchida precisa ser real e maior de idade — mesma régua do cadastro.
    if (birthDate && (!ISO_DATE.test(birthDate) || !hasMinAge(birthDate))) {
      setGeneralError(texts.profile.edit.birthDateInvalid);
      return;
    }
    // Os emblemas vão por endpoint próprio (a lista de até 5 não passa pelo PUT do perfil) e antes
    // do resto: assim o perfil já volta com a lista nova. Lista vazia limpa todos.
    if (badges.join("\n") !== badgesOf(profile).join("\n")) {
      try {
        await preferencesApi.setBadges(badges);
      } catch (err) {
        setGeneralError(err instanceof ApiError ? err.message : texts.profile.imageUploadError);
        return;
      }
    }
    if (showRanking !== (profile.showRanking !== false)) {
      try {
        await profileApi.setRanking(showRanking);
      } catch (err) {
        setGeneralError(err instanceof ApiError ? err.message : texts.errors.unexpected);
        return;
      }
    }
    await updateProfile.mutateAsync({
      username: username !== profile.username ? username : undefined,
      // String vazia limpa (o servidor só preserva quando o campo vem ausente/null).
      aka: aka.trim(),
      name: name !== profile.name ? name : undefined,
      headline: headline || null,
      bio: bio || null,
      company: company || null,
      location: location || null,
      birthDate: birthDate !== (profile.birthDate ?? "") ? birthDate || null : undefined,
      // Apenas apagar o valor, nao alterava o campo. O servidor entende string vazia como "limpar", null como "preservar".
      // Desta forma, se o usuário apagar o campo, ele será removido do perfil de fato.
      availability:
        availability !== (profile.availability ?? "")
          ? availability === ""
            ? ""
            : availability
          : undefined,
      portfolio: portfolio || null,
      externalLinks: linksText
        ? linksText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      skills: skillsText
        ? skillsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      goals: goalsText
        ? goalsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      openToWork,
      isMentor,
    });
  };

  const tabs = [
    { key: "info" as const, label: texts.profile.edit.tabs.info },
    { key: "experiences" as const, label: texts.profile.edit.tabs.experiences },
    { key: "education" as const, label: texts.profile.edit.tabs.education },
    { key: "certifications" as const, label: texts.profile.edit.tabs.certifications },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-border-soft bg-surface-card px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-normal text-text-strong">
              {texts.profile.edit.title}
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                {tab === "info" ? texts.common.cancel : texts.common.close}
              </Button>

              {generalError && (
                <p
                  className="mr-auto max-w-[60%] text-xs font-normal text-destructive"
                  role="alert"
                >
                  {generalError}
                </p>
              )}

              {/* Experiências/formação/certificações têm o próprio "Salvar" por item. Manter o
                  botão do perfil aqui fechava o diálogo e descartava a edição em andamento. */}
              {tab === "info" && (
                <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? texts.common.saving : texts.common.save}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-normal transition ${
                  tab === t.key
                    ? "bg-surface-2 text-primary"
                    : "text-text-subtle hover:bg-surface-3 hover:text-text-strong"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6 pt-4">
          {tab === "info" && (
            <div className="space-y-5">
              <Field label={texts.profile.edit.fields.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={160}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.username} error={usernameError}>
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  placeholder={texts.profile.edit.placeholders.username}
                  maxLength={80}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.aka}>
                <Input
                  value={aka}
                  onChange={(e) => setAka(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.aka}
                  maxLength={60}
                  className="h-10 border-border-soft bg-surface-1"
                />

                <p className="text-xs font-normal text-text-subtle">{texts.profile.edit.akaHint}</p>
              </Field>

              <Field label={texts.profile.edit.fields.badges}>
                <div className="flex flex-wrap items-center gap-2">
                  {badges.map((url, index) => (
                    <span key={url} className="relative inline-flex shrink-0">
                      <img
                        src={resolveCdnUrl(url)}
                        alt=""
                        className="h-10 w-10 rounded-full border border-border-soft bg-surface-1 object-cover"
                      />

                      <button
                        type="button"
                        aria-label={`${texts.profile.edit.badgeRemove} ${index + 1}`}
                        title={`${texts.profile.edit.badgeRemove} ${index + 1}`}
                        onClick={() =>
                          setBadges((current) => current.filter((item) => item !== url))
                        }
                        className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-surface-1 text-text-subtle ring-1 ring-border-soft transition hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}

                  {badges.length < MAX_BADGES ? (
                    <button
                      type="button"
                      onClick={() => badgeRef.current?.click()}
                      disabled={badgeUpload.status === "uploading"}
                      aria-label={texts.profile.edit.badgeUpload}
                      title={texts.profile.edit.badgeUpload}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dashed border-border-soft text-text-subtle transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                    >
                      {badgeUpload.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}

                  <input
                    ref={badgeRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBadgeUpload}
                  />
                </div>

                <p className="text-xs font-normal text-text-subtle">
                  {badges.length >= MAX_BADGES
                    ? texts.profile.edit.badgesFull
                    : texts.profile.edit.badgesHint}
                </p>
              </Field>

              <Field label={texts.profile.edit.fields.headline}>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.headline}
                  maxLength={180}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.bio}>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={1024}
                  className="border-border-soft bg-surface-1"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={texts.profile.edit.fields.company}>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    maxLength={160}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </Field>

                <Field label={texts.profile.edit.fields.location}>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={160}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </Field>

                <Field label={texts.profile.edit.fields.birthDate}>
                  <DateTextInput
                    autoComplete="bday"
                    value={birthDate}
                    onValueChange={setBirthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </Field>
              </div>

              <Field label={texts.profile.edit.fields.availability}>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.availability}
                  maxLength={160}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.portfolio}>
                <Input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.portfolio}
                  maxLength={500}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.externalLinks}>
                <Textarea
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.skills}>
                {/* 1600 caracteres: espaço para listar habilidades separadas por vírgula ou escrever
                    uma frase inteira — o servidor aceita o mesmo teto. */}
                <Input
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  maxLength={1600}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <Field label={texts.profile.edit.fields.goals}>
                <Input
                  value={goalsText}
                  onChange={(e) => setGoalsText(e.target.value)}
                  maxLength={1600}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>

              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 text-sm font-normal text-text-strong">
                  <Switch checked={openToWork} onCheckedChange={setOpenToWork} />

                  <>{texts.profile.edit.openToWork}</>
                </label>

                <label className="flex items-center gap-3 text-sm font-normal text-text-strong">
                  <Switch checked={isMentor} onCheckedChange={setIsMentor} />

                  <>{texts.profile.edit.mentorAvailable}</>
                </label>
              </div>

              <label className="flex items-start gap-3 text-sm font-normal text-text-strong">
                <Switch checked={showRanking} onCheckedChange={setShowRanking} />

                <span>
                  <span className="block">{texts.profile.edit.showRanking}</span>

                  <span className="block text-xs font-normal text-text-subtle">
                    {texts.profile.edit.showRankingHint}
                  </span>
                </span>
              </label>
            </div>
          )}

          {tab === "experiences" && (
            <SubList<Experience, ExperienceRequest>
              items={experiences}
              fields={[
                { key: "title", label: texts.profile.edit.experienceFields.title, required: true },
                {
                  key: "company",
                  label: texts.profile.edit.experienceFields.company,
                  required: true,
                },
                { key: "location", label: texts.profile.edit.experienceFields.location },
                {
                  key: "description",
                  label: texts.profile.edit.experienceFields.description,
                  multiline: true,
                },
                {
                  key: "startDate",
                  label: texts.profile.edit.experienceFields.startDate,
                  type: "date",
                },
                {
                  key: "endDate",
                  label: texts.profile.edit.experienceFields.endDate,
                  type: "date",
                },
              ]}
              currentlyHereKey="currentlyHere"
              createApi={(data) => profileApi.experiences.create(data)}
              updateApi={(id, data) => profileApi.experiences.update(id, data)}
              deleteApi={(id) => profileApi.experiences.delete(id)}
              queryKey={["me", "experiences"]}
              emptyMessage={texts.profile.edit.emptyExperience}
              newItem={{
                title: "",
                company: "",
                location: "",
                description: "",
                startDate: "",
                endDate: "",
              }}
            />
          )}

          {tab === "education" && (
            <SubList<Education, EducationRequest>
              items={education}
              fields={[
                { key: "school", label: texts.profile.edit.educationFields.school, required: true },
                { key: "degree", label: texts.profile.edit.educationFields.degree, required: true },
                { key: "field", label: texts.profile.edit.educationFields.field },
                {
                  key: "description",
                  label: texts.profile.edit.educationFields.description,
                  multiline: true,
                },
                {
                  key: "startDate",
                  label: texts.profile.edit.educationFields.startDate,
                  type: "date",
                },
                { key: "endDate", label: texts.profile.edit.educationFields.endDate, type: "date" },
              ]}
              currentlyHereKey="currentlyHere"
              createApi={(data) => profileApi.education.create(data)}
              updateApi={(id, data) => profileApi.education.update(id, data)}
              deleteApi={(id) => profileApi.education.delete(id)}
              queryKey={["me", "education"]}
              emptyMessage={texts.profile.edit.emptyEducation}
              newItem={{
                school: "",
                degree: "",
                field: "",
                description: "",
                startDate: "",
                endDate: "",
              }}
            />
          )}

          {tab === "certifications" && (
            <SubList<Certification, CertificationRequest>
              items={certifications}
              fields={[
                { key: "name", label: texts.profile.edit.certificationFields.name, required: true },
                {
                  key: "issuer",
                  label: texts.profile.edit.certificationFields.issuer,
                  required: true,
                },
                {
                  key: "description",
                  label: texts.profile.edit.certificationFields.description,
                  multiline: true,
                },
                {
                  key: "issueDate",
                  label: texts.profile.edit.certificationFields.issueDate,
                  type: "date",
                },
                {
                  key: "expirationDate",
                  label: texts.profile.edit.certificationFields.expirationDate,
                  type: "date",
                },
                {
                  key: "credentialUrl",
                  label: texts.profile.edit.certificationFields.credentialUrl,
                },
              ]}
              createApi={(data) => profileApi.certifications.create(data)}
              updateApi={(id, data) => profileApi.certifications.update(id, data)}
              deleteApi={(id) => profileApi.certifications.delete(id)}
              queryKey={["me", "certifications"]}
              emptyMessage={texts.profile.edit.emptyCertification}
              newItem={{
                name: "",
                issuer: "",
                description: "",
                issueDate: "",
                expirationDate: "",
                credentialUrl: "",
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-normal text-text-subtle">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubList<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>({
  items,
  fields,
  currentlyHereKey,
  createApi,
  updateApi,
  deleteApi,
  queryKey,
  emptyMessage,
  newItem,
}: SubListProps<T, TData>) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const create = useMutation({
    mutationFn: (data: TData) => createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // O perfil público tem a própria query (por username): invalida para a seção
      // "Experiências" refletir a edição sem precisar recarregar a página.
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      setForm({ ...newItem });
      setCurrentlyHere(false);
      setEditingId(null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: SubListUpdate<TData>) => updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      setEditingId(null);
      setForm({ ...newItem });
      setCurrentlyHere(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
    },
  });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const values: Record<string, string> = {};
    for (const f of fields) {
      values[f.key] = String((item as Record<string, unknown>)[f.key] ?? "");
    }
    setForm(values);
    if (currentlyHereKey) {
      setCurrentlyHere(Boolean((item as Record<string, unknown>)[currentlyHereKey]));
    }
  };

  const handleSubmit = async () => {
    const data: Record<string, unknown> = { ...form };
    if (currentlyHereKey) {
      data[currentlyHereKey] = currentlyHere;
      if (currentlyHere) data.endDate = null;
    }
    if (editingId && editingId !== "__new__") {
      await update.mutateAsync({ id: editingId, data: data as TData });
    } else {
      await create.mutateAsync(data as TData);
    }
  };

  const isPending = create.isPending || update.isPending;
  const showForm = editingId !== null;

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border-soft p-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.multiline ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={2}
                  // Sem `h-10`: a altura fixa brigava com o `min-h-[60px]` do primitivo, então
                  // o campo ficava com 60px de qualquer jeito. As `rows` é que mandam.
                  className="border-border-soft bg-surface-1"
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-10 border-border-soft bg-surface-1"
                />
              )}
            </Field>
          ))}
          {currentlyHereKey && (
            <label className="flex items-center gap-2 text-sm font-normal text-text-strong">
              <Switch checked={currentlyHere} onCheckedChange={setCurrentlyHere} />

              <>{texts.profile.edit.currentlyHere}</>
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? texts.common.saving : texts.common.save}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ ...newItem });
                setCurrentlyHere(false);
              }}
            >
              {texts.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm font-normal text-text-subtle">{emptyMessage}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-sm font-normal">
                    <p className="break-words text-text-strong">
                      {String((item as Record<string, unknown>)[fields[0].key] ?? "")}
                    </p>

                    <p className="break-words text-text-subtle">
                      {String((item as Record<string, unknown>)[fields[1]?.key] ?? "")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      aria-label={texts.common.edit}
                      title={texts.common.edit}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4 text-text-subtle" />
                    </button>

                    <button
                      onClick={() => remove.mutate(item.id)}
                      aria-label={texts.common.remove}
                      title={texts.common.remove}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => {
              setEditingId("__new__");
              setForm({ ...newItem });
              setCurrentlyHere(false);
            }}
          >
            <Plus className="h-4 w-4" />

            <>{texts.common.add}</>
          </Button>
        </>
      )}
    </div>
  );
}
