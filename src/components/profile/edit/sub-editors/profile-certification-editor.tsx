import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Certification } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { certificationFields } from "./profile-sub-fields";

type CertificationRequest = Parameters<typeof profileApi.certifications.create>[0];

export function ProfileCertificationEditor() {
  const { data: items = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: () => profileApi.certifications.list(),
  });

  return (
    <ProfileSubList<Certification, CertificationRequest>
      items={items}
      fields={certificationFields}
      createApi={profileApi.certifications.create}
      updateApi={profileApi.certifications.update}
      deleteApi={profileApi.certifications.delete}
      queryKey={["me", "certifications"]}
      emptyMessage={texts.profile.edit.emptyCertification}
      newItem={{
        name: "",
        issuer: "",
        description: "",
        issueDate: "",
        expirationDate: "",
        credentialUrl: "",
      }}
    />
  );
}
