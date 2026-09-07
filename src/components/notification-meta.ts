import type { NotificationMeta } from "@/types/components/notification/notification-meta";
import {
  AtSign,
  Briefcase,
  Calendar,
  GraduationCap,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

export const notificationMeta: Record<string, NotificationMeta> = {
  connection: { icon: UserPlus, className: "bg-primary-soft text-primary" },
  connection_request: { icon: UserPlus, className: "bg-primary-soft text-primary" },
  connection_accepted: { icon: UserPlus, className: "bg-growth/15 text-growth" },
  message: { icon: MessageCircle, className: "bg-secondary/30 text-secondary-foreground" },
  mention: { icon: AtSign, className: "bg-accent text-accent-foreground" },
  new_comment: { icon: MessageCircle, className: "bg-primary-soft text-primary" },
  new_reaction: { icon: Heart, className: "bg-accent text-accent-foreground" },
  event: { icon: Calendar, className: "bg-growth/15 text-growth" },
  job: { icon: Briefcase, className: "bg-opportunity/20 text-opportunity-foreground" },
  mentoring: { icon: GraduationCap, className: "bg-primary-soft text-primary" },
};
