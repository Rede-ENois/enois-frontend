import { useQuery } from "@tanstack/react-query";

import type { ProfileNetworkDialogProps } from "@/types/components/profile/profile-network-dialog-props";
import { ProfileNetworkDialog as ProfileNetworkDialogView } from "@rede-enois/design-system/domain";

import { profileApi } from "@/lib/api";

export function ProfileNetworkDialog({
  username,
  name,
  kind,
  open,
  onOpenChange,
}: ProfileNetworkDialogProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["profile-network", username, kind],
    queryFn: () => profileApi.network(username, kind),
    enabled: open,
  });

  return (
    <ProfileNetworkDialogView
      name={name}
      kind={kind}
      open={open}
      onOpenChange={onOpenChange}
      people={data?.map((person) => ({ ...person, href: `/perfil/${person.username}` }))}
      pending={isPending}
      error={isError}
    />
  );
}
