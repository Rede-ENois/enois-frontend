import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { ApiError, profileApi } from "@/lib/api";
import type { Certification, Education, Experience, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { buildProfileUpdate } from "@/utils/profile";

import {
  EditProfileInfoForm,
  type EditProfileInfoValues,
} from "@/components/profile/edit-profile-info-form";
import {
  EditProfileShell,
  type EditProfileTab,
} from "@/components/profile/edit-profile-shell";
import { ProfileSubList, type ProfileSubField } from "@/components/profile/profile-sub-list";

type ExperienceRequest = Parameters<typeof profileApi.experiences.create>[0];
type EducationRequest = Parameters<typeof profileApi.education.create>[0];
type CertificationRequest = Parameters<typeof profileApi.certifications.create>[0];

const experienceFields: ProfileSubField[] = [
  { key: "title", label: texts.profile.edit.experienceFields.title, required: true },
  { key: "company", label: texts.profile.edit.experienceFields.company, required: true },
  { key: "location", label: texts.profile.edit.experienceFields.location },
  {
    key: "description",
    label: texts.profile.edit.experienceFields.description,
    multiline: true,
  },
  { key: "startDate", label: texts.profile.edit.experienceFields.startDate, type: "date" },
  { key: "endDate", label: texts.profile.edit.experienceFields.endDate, type: "date" },
];

const educationFields: ProfileSubField[] = [
  { key: "school", label: texts.profile.edit.educationFields.school, required: true },
  { key: "degree", label: texts.profile.edit.educationFields.degree, required: true },
  { key: "field", label: texts.profile.edit.educationFields.field },
  {
    key: "description",
    label: texts.profile.edit.educationFields.description,
    multiline: true,
  },
  { key: "startDate", label: texts.profile.edit.educationFields.startDate, type: "date" },
  { key: "endDate", label: texts.profile.edit.educationFields.endDate, type: "date" },
];

const certificationFields: ProfileSubField[] = [
  { key: "name", label: texts.profile.edit.certificationFields.name, required: true },
  { key: "issuer", label: texts.profile.edit.certificationFields.issuer, required: true },
  {
    key: "description",
    label: texts.profile.edit.certificationFields.description,
    multiline: true,
  },
  { key: "issueDate", label: texts.profile.edit.certificationFields.issueDate, type: "date" },
  {
    key: "expirationDate",
    label: texts.profile.edit.certificationFields.expirationDate,
    type: "date",
  },
  { key: "credentialUrl", label: texts.profile.edit.certificationFields.credentialUrl },
];

interface Props {
  profile: Profile;
  children: React.ReactNode;
}

export function EditProfileDialog({ profile, children }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<EditProfileTab>("info");
  const [usernameError, setUsernameError] = useState("");
  const [values, setValues] = useState<EditProfileInfoValues>(() => ({
    username: profile.username,
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    company: profile.company ?? "",
    location: profile.location ?? "",
    availability: profile.availability ?? "",
    portfolio: profile.portfolio ?? "",
    linksText: (profile.externalLinks ?? []).join("\n"),
    skillsText: (profile.skills ?? []).join(", "),
    goalsText: (profile.goals ?? []).join(", "),
    openToWork: profile.openToWork,
    isMentor: profile.isMentor,
  }));

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

  const handleChange = <K extends keyof EditProfileInfoValues>(
    field: K,
    value: EditProfileInfoValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "username") setUsernameError("");
  };

  const handleSave = async () => {
    setUsernameError("");
    await updateProfile.mutateAsync(buildProfileUpdate(profile, values));
  };

  return (
    <EditProfileShell
      open={open}
      trigger={children}
      tab={tab}
      saving={updateProfile.isPending}
      onOpenChange={setOpen}
      onTabChange={setTab}
      onSave={handleSave}
    >
      {tab === "info" && (
        <EditProfileInfoForm
          values={values}
          usernameError={usernameError}
          onChange={handleChange}
        />
      )}

      {tab === "experiences" && (
        <ProfileSubList<Experience, ExperienceRequest>
          items={experiences}
          fields={experienceFields}
          currentlyHereKey="currentlyHere"
          createApi={profileApi.experiences.create}
          updateApi={profileApi.experiences.update}
          deleteApi={profileApi.experiences.delete}
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
        <ProfileSubList<Education, EducationRequest>
          items={education}
          fields={educationFields}
          currentlyHereKey="currentlyHere"
          createApi={profileApi.education.create}
          updateApi={profileApi.education.update}
          deleteApi={profileApi.education.delete}
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
        <ProfileSubList<Certification, CertificationRequest>
          items={certifications}
          fields={certificationFields}
          createApi={profileApi.certifications.create}
          updateApi={profileApi.certifications.update}
          deleteApi={profileApi.certifications.delete}
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
    </EditProfileShell>
  );
}
