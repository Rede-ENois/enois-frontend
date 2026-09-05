import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { ApiError, profileApi } from "@/lib/api";
import type { Certification, Education, Experience, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { buildProfileUpdate } from "@/utils/profile";

import { Button } from "@/components/ui/button";
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

interface Props {
  profile: Profile;
  children: React.ReactNode;
}

export function EditProfileDialog({ profile, children }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "experiences" | "education" | "certifications">(
    "info",
  );

  const [username, setUsername] = useState(profile.username);
  const [name, setName] = useState(profile.name);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [availability, setAvailability] = useState(profile.availability ?? "");
  const [portfolio, setPortfolio] = useState(profile.portfolio ?? "");
  const [linksText, setLinksText] = useState((profile.externalLinks ?? []).join("\n"));
  const [skillsText, setSkillsText] = useState((profile.skills ?? []).join(", "));
  const [goalsText, setGoalsText] = useState((profile.goals ?? []).join(", "));
  const [openToWork, setOpenToWork] = useState(profile.openToWork);
  const [isMentor, setIsMentor] = useState(profile.isMentor);
  const [usernameError, setUsernameError] = useState("");

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
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setUsernameError(texts.profile.edit.usernameTaken);
      }
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

  const handleSave = async () => {
    setUsernameError("");
    await updateProfile.mutateAsync(
      buildProfileUpdate(profile, {
        username,
        name,
        headline,
        bio,
        company,
        location,
        availability,
        portfolio,
        linksText,
        skillsText,
        goalsText,
        openToWork,
        isMentor,
      }),
    );
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
            <DialogTitle className="text-[18px] font-light text-text-strong">
              {texts.profile.edit.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                {texts.common.cancel}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? texts.common.saving : texts.common.save}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-light transition ${
                  tab === item.key
                    ? "bg-surface-2 text-primary"
                    : "text-text-subtle hover:bg-surface-3 hover:text-text-strong"
                }`}
              >
                {item.label}
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
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.username} error={usernameError}>
                <Input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setUsernameError("");
                  }}
                  placeholder={texts.profile.edit.placeholders.username}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.headline}>
                <Input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder={texts.profile.edit.placeholders.headline}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.bio}>
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  className="h-10 border-border-soft bg-surface-1 pl-9"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={texts.profile.edit.fields.company}>
                  <Input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </Field>
                <Field label={texts.profile.edit.fields.location}>
                  <Input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </Field>
              </div>
              <Field label={texts.profile.edit.fields.availability}>
                <Input
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  placeholder={texts.profile.edit.placeholders.availability}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.portfolio}>
                <Input
                  value={portfolio}
                  onChange={(event) => setPortfolio(event.target.value)}
                  placeholder={texts.profile.edit.placeholders.portfolio}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.externalLinks}>
                <Textarea
                  value={linksText}
                  onChange={(event) => setLinksText(event.target.value)}
                  rows={3}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.skills}>
                <Input
                  value={skillsText}
                  onChange={(event) => setSkillsText(event.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <Field label={texts.profile.edit.fields.goals}>
                <Input
                  value={goalsText}
                  onChange={(event) => setGoalsText(event.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </Field>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
                  <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
                  {texts.profile.edit.openToWork}
                </label>
                <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
                  <Switch checked={isMentor} onCheckedChange={setIsMentor} />
                  {texts.profile.edit.mentorAvailable}
                </label>
              </div>
            </div>
          )}

          {tab === "experiences" && (
            <SubList<Experience, ExperienceRequest>
              items={experiences}
              fields={[
                {
                  key: "title",
                  label: texts.profile.edit.experienceFields.title,
                  required: true,
                },
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
                {
                  key: "school",
                  label: texts.profile.edit.educationFields.school,
                  required: true,
                },
                {
                  key: "degree",
                  label: texts.profile.edit.educationFields.degree,
                  required: true,
                },
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
                {
                  key: "endDate",
                  label: texts.profile.edit.educationFields.endDate,
                  type: "date",
                },
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
                {
                  key: "name",
                  label: texts.profile.edit.certificationFields.name,
                  required: true,
                },
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface SubField {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}

type ExperienceRequest = Parameters<typeof profileApi.experiences.create>[0];
type EducationRequest = Parameters<typeof profileApi.education.create>[0];
type CertificationRequest = Parameters<typeof profileApi.certifications.create>[0];

function SubList<
  T extends { id: string },
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
}: {
  items: T[];
  fields: SubField[];
  currentlyHereKey?: string;
  createApi: (data: TData) => Promise<T>;
  updateApi: (id: string, data: TData) => Promise<T>;
  deleteApi: (id: string) => Promise<void>;
  queryKey: string[];
  emptyMessage: string;
  newItem: Record<string, string>;
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const create = useMutation({
    mutationFn: (data: TData) => createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm({ ...newItem });
      setCurrentlyHere(false);
      setEditingId(null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TData }) => updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
      setForm({ ...newItem });
      setCurrentlyHere(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          String((item as Record<string, unknown>)[field.key] ?? ""),
        ]),
      ),
    );
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

    const submitActions = {
      create: () => create.mutateAsync(data as TData),
      update: () => update.mutateAsync({ id: editingId!, data: data as TData }),
    };
    const action = editingId && editingId !== "__new__" ? "update" : "create";
    await submitActions[action]();
  };

  const isPending = create.isPending || update.isPending;
  const showForm = editingId !== null;

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border-soft p-4">
          {fields.map((field) => (
            <Field key={field.key} label={field.label}>
              {field.multiline ? (
                <Textarea
                  value={form[field.key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  rows={2}
                  className="h-10 border-border-soft bg-surface-1"
                />
              ) : (
                <Input
                  type={field.type ?? "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className="h-10 border-border-soft bg-surface-1"
                />
              )}
            </Field>
          ))}
          {currentlyHereKey && (
            <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
              <Switch checked={currentlyHere} onCheckedChange={setCurrentlyHere} />
              {texts.profile.edit.currentlyHere}
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
            <p className="py-8 text-center text-[13px] font-light text-text-subtle">
              {emptyMessage}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-[13px] font-light">
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
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4 text-text-subtle" />
                    </button>
                    <button
                      onClick={() => remove.mutate(item.id)}
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
            <Plus className="h-4 w-4" /> {texts.common.add}
          </Button>
        </>
      )}
    </div>
  );
}
