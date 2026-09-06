import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Certification, CertificationInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { certificationFields } from "./profile-sub-fields";

export function ProfileCertificationEditor() {
  const { data: certifications = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: () => profileApi.certifications.list(),
  });

  return (
    <ProfileSubList<Certification, CertificationInput>
      items={certifications}
      fields={certificationFields}
      createApi={profileApi.certifications.create}
      updateApi={profileApi.certifications.update}
      removeApi={profileApi.certifications.remove}
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
