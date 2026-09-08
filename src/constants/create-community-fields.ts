import { texts } from "@/texts";

export const CREATE_COMMUNITY_FIELDS = [
  { key: "name", label: texts.communities.create.name, control: "input" },
  {
    key: "description",
    label: texts.communities.create.description,
    control: "textarea",
    rows: 3,
  },
] as const;
