import { texts } from "@/texts";

export const CREATE_EVENT_FIELD_ROWS = [
  [
    {
      key: "title",
      label: texts.events.form.title,
      type: "text",
      placeholder: undefined,
    },
  ],
  [
    {
      key: "date",
      label: texts.events.form.date,
      type: "date",
      placeholder: undefined,
    },
    {
      key: "time",
      label: texts.events.form.time,
      type: "time",
      placeholder: undefined,
    },
  ],
  [
    {
      key: "host",
      label: texts.events.form.host,
      type: "text",
      placeholder: texts.events.form.hostPlaceholder,
    },
  ],
] as const;
