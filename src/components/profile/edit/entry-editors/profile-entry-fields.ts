import { texts } from "@/texts";
import type { ProfileEntryField } from "@/types/components/profile/edit/entry-list/profile-entry-field";

export const experienceFields: ProfileEntryField[] = [
  { key: "title", label: texts.profile.edit.experienceFields.title, required: true },
  { key: "company", label: texts.profile.edit.experienceFields.company, required: true },
  { key: "location", label: texts.profile.edit.experienceFields.location },
  { key: "description", label: texts.profile.edit.experienceFields.description, multiline: true },
  { key: "startDate", label: texts.profile.edit.experienceFields.startDate, type: "date" },
  { key: "endDate", label: texts.profile.edit.experienceFields.endDate, type: "date" },
];

export const educationFields: ProfileEntryField[] = [
  { key: "school", label: texts.profile.edit.educationFields.school, required: true },
  { key: "degree", label: texts.profile.edit.educationFields.degree, required: true },
  { key: "field", label: texts.profile.edit.educationFields.field },
  { key: "description", label: texts.profile.edit.educationFields.description, multiline: true },
  { key: "startDate", label: texts.profile.edit.educationFields.startDate, type: "date" },
  { key: "endDate", label: texts.profile.edit.educationFields.endDate, type: "date" },
];

export const certificationFields: ProfileEntryField[] = [
  { key: "name", label: texts.profile.edit.certificationFields.name, required: true },
  { key: "issuer", label: texts.profile.edit.certificationFields.issuer, required: true },
  { key: "description", label: texts.profile.edit.certificationFields.description, multiline: true },
  { key: "issueDate", label: texts.profile.edit.certificationFields.issueDate, type: "date" },
  { key: "expirationDate", label: texts.profile.edit.certificationFields.expirationDate, type: "date" },
  { key: "credentialUrl", label: texts.profile.edit.certificationFields.credentialUrl },
];
