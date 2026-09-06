import type { ConnectionRequest } from "@/types/application/network/connection-request";

export type RequestCardProps = {
  request: ConnectionRequest;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
};
