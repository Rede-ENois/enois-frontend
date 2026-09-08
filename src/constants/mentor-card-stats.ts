import { texts } from "@/texts";
import { Calendar, Star } from "lucide-react";

export const MENTOR_CARD_STATS = [
  {
    key: "rating",
    field: "rating",
    label: texts.mentoring.rating,
    icon: Star,
    valueClassName: "font-semibold",
    iconClassName: "fill-opportunity text-opportunity",
  },
  {
    key: "sessions",
    field: "sessions",
    label: texts.mentoring.sessions,
    icon: null,
    valueClassName: "font-semibold",
    iconClassName: "",
  },
  {
    key: "investment",
    field: "price",
    label: texts.mentoring.investment,
    icon: null,
    valueClassName: "font-medium",
    iconClassName: "",
  },
  {
    key: "next-slot",
    field: "nextSlot",
    label: texts.mentoring.nextSlot,
    icon: Calendar,
    valueClassName: "font-medium",
    iconClassName: "",
  },
] as const;
