import { useState } from "react";

import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { profileApi } from "@/lib/api/profile";
import { ApiError } from "@/lib/api-client";
import { texts } from "@/texts";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Certification } from "@/types/application/profile/certification";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Education } from "@/types/application/profile/education";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Experience } from "@/types/application/profile/experience";
import type { Props } from "@/types/components/profile/edit-profile-dialog/props";

import { SubList } from "@/components/edit-profile-sub-list";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
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
    await updateProfile.mutateAsync({
      username: username !== profile.username ? username : undefined,
      name: name !== profile.name ? name : undefined,
      headline: headline || null,
      bio: bio || null,
      company: company || null,
      location: location || null,
      availability: availability || null,
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
  const fieldLabelClassName = "text-[13px] font-light text-text-subtle";

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
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-light transition ${
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
              <FormField label={texts.profile.edit.fields.name} labelClassName={fieldLabelClassName}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField
                label={texts.profile.edit.fields.username}
                error={usernameError}
                labelClassName={fieldLabelClassName}
              >
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  placeholder={texts.profile.edit.placeholders.username}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.headline} labelClassName={fieldLabelClassName}>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.headline}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.bio} labelClassName={fieldLabelClassName}>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="h-10 border-border-soft bg-surface-1 pl-9"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={texts.profile.edit.fields.company} labelClassName={fieldLabelClassName}>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </FormField>
                <FormField label={texts.profile.edit.fields.location} labelClassName={fieldLabelClassName}>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 border-border-soft bg-surface-1"
                  />
                </FormField>
              </div>
              <FormField label={texts.profile.edit.fields.availability} labelClassName={fieldLabelClassName}>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.availability}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.portfolio} labelClassName={fieldLabelClassName}>
                <Input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder={texts.profile.edit.placeholders.portfolio}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.externalLinks} labelClassName={fieldLabelClassName}>
                <Textarea
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  rows={3}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.skills} labelClassName={fieldLabelClassName}>
                <Input
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <FormField label={texts.profile.edit.fields.goals} labelClassName={fieldLabelClassName}>
                <Input
                  value={goalsText}
                  onChange={(e) => setGoalsText(e.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              </FormField>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
                  <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
                  <>{texts.profile.edit.openToWork}</>
                </label>
                <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
                  <Switch checked={isMentor} onCheckedChange={setIsMentor} />
                  <>{texts.profile.edit.mentorAvailable}</>
                </label>
              </div>
            </div>
          )}

          {tab === "experiences" && (
            <SubList<Experience, ExperienceRequest>
              items={experiences}
              fields={[
                { key: "title", label: texts.profile.edit.experienceFields.title, required: true },
                { key: "company", label: texts.profile.edit.experienceFields.company, required: true },
                { key: "location", label: texts.profile.edit.experienceFields.location },
                { key: "description", label: texts.profile.edit.experienceFields.description, multiline: true },
                { key: "startDate", label: texts.profile.edit.experienceFields.startDate, type: "date" },
                { key: "endDate", label: texts.profile.edit.experienceFields.endDate, type: "date" },
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
                { key: "description", label: texts.profile.edit.educationFields.description, multiline: true },
                { key: "startDate", label: texts.profile.edit.educationFields.startDate, type: "date" },
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
                { key: "issuer", label: texts.profile.edit.certificationFields.issuer, required: true },
                { key: "description", label: texts.profile.edit.certificationFields.description, multiline: true },
                { key: "issueDate", label: texts.profile.edit.certificationFields.issueDate, type: "date" },
                { key: "expirationDate", label: texts.profile.edit.certificationFields.expirationDate, type: "date" },
                { key: "credentialUrl", label: texts.profile.edit.certificationFields.credentialUrl },
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
