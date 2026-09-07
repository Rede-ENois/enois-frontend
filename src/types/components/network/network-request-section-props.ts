import type { ConnectionRequest } from "@/types/application/network/connection-request";

export type NetworkRequestSectionProps = {
  label: string;
  labelClassName?: string;
  requests: ConnectionRequest[];
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
};
