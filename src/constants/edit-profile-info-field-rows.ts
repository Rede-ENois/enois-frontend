import { texts } from "@/texts";

export const EDIT_PROFILE_INFO_FIELD_ROWS = [
  [
    {
      key: "name",
      field: "name",
      label: texts.profile.edit.fields.name,
      placeholder: undefined,
      control: "input",
    },
  ],
  [
    {
      key: "username",
      field: "username",
      label: texts.profile.edit.fields.username,
      placeholder: texts.profile.edit.placeholders.username,
      control: "input",
    },
  ],
  [
    {
      key: "headline",
      field: "headline",
      label: texts.profile.edit.fields.headline,
      placeholder: texts.profile.edit.placeholders.headline,
      control: "input",
    },
  ],
  [
    {
      key: "bio",
      field: "bio",
      label: texts.profile.edit.fields.bio,
      placeholder: undefined,
      control: "textarea",
    },
  ],
  [
    {
      key: "company",
      field: "company",
      label: texts.profile.edit.fields.company,
      placeholder: undefined,
      control: "input",
    },
    {
      key: "location",
      field: "location",
      label: texts.profile.edit.fields.location,
      placeholder: undefined,
      control: "input",
    },
  ],
  [
    {
      key: "availability",
      field: "availability",
      label: texts.profile.edit.fields.availability,
      placeholder: texts.profile.edit.placeholders.availability,
      control: "input",
    },
  ],
  [
    {
      key: "portfolio",
      field: "portfolio",
      label: texts.profile.edit.fields.portfolio,
      placeholder: texts.profile.edit.placeholders.portfolio,
      control: "input",
    },
  ],
  [
    {
      key: "external-links",
      field: "linksText",
      label: texts.profile.edit.fields.externalLinks,
      placeholder: undefined,
      control: "textarea",
    },
  ],
  [
    {
      key: "skills",
      field: "skillsText",
      label: texts.profile.edit.fields.skills,
      placeholder: undefined,
      control: "input",
    },
  ],
  [
    {
      key: "goals",
      field: "goalsText",
      label: texts.profile.edit.fields.goals,
      placeholder: undefined,
      control: "input",
    },
  ],
] as const;
