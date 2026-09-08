import type { NetworkRequestSectionProps } from "@/types/components/network/network-request-section-props";

import { RequestCard } from "@/components/network-request-card";

export function NetworkRequestSection({
  label,
  labelClassName = "",
  requests,
  onAccept,
  onCancel,
}: NetworkRequestSectionProps) {
  return (
    <>
      <div className={labelClassName}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>

      {requests.map((request) => (
        <RequestCard key={request.id} request={request} onAccept={onAccept} onCancel={onCancel} />
      ))}
    </>
  );
}
