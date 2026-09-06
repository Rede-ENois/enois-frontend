import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Certification, CertificationInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileEntryList } from "../entry-list/profile-entry-list";
import { certificationFields } from "./profile-entry-fields";

export function ProfileCertificationEditor() {
  const { data: certifications = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: () => profileApi.certifications.list(),
  });

  return (
    <ProfileEntryList<Certification, CertificationInput>
      entries={certifications}
      fields={certificationFields}
      createEntry={profileApi.certifications.create}
      updateEntry={profileApi.certifications.update}
      removeEntry={profileApi.certifications.remove}
      queryKey={["me", "certifications"]}
      emptyMessage={texts.profile.edit.emptyCertification}
      newEntry={{
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
