import { useQuery } from "@tanstack/react-query";

import { createCertification } from "@/lib/api/profile/certifications/create-certification";
import { deleteCertification } from "@/lib/api/profile/certifications/delete-certification";
import { listCertifications } from "@/lib/api/profile/certifications/list-certifications";
import { updateCertification } from "@/lib/api/profile/certifications/update-certification";
import { texts } from "@/texts";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Certification } from "@/types/application/profile/certification";

import { SubList } from "@/components/edit-profile-sub-list";

export function EditProfileCertifications() {
  const { data: certifications = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: listCertifications,
  });

  return (
    <SubList<Certification, CertificationRequest>
      items={certifications}
      fields={[
        { key: "name", label: texts.profile.edit.certificationFields.name, required: true },
        { key: "issuer", label: texts.profile.edit.certificationFields.issuer, required: true },
        {
          key: "description",
          label: texts.profile.edit.certificationFields.description,
          multiline: true,
        },
        { key: "issueDate", label: texts.profile.edit.certificationFields.issueDate, type: "date" },
        {
          key: "expirationDate",
          label: texts.profile.edit.certificationFields.expirationDate,
          type: "date",
        },
        { key: "credentialUrl", label: texts.profile.edit.certificationFields.credentialUrl },
      ]}
      createApi={createCertification}
      updateApi={updateCertification}
      deleteApi={deleteCertification}
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
