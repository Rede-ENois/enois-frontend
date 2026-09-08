import { Briefcase, MapPin } from "lucide-react";

export const PROFILE_HEADER_METADATA_ITEMS = [
  { key: "company", field: "company", icon: Briefcase },
  { key: "location", field: "location", icon: MapPin },
] as const;
