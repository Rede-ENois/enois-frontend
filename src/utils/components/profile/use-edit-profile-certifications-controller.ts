import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";

import { createCertification } from "@/lib/api/profile/certifications/create-certification";
import { deleteCertification } from "@/lib/api/profile/certifications/delete-certification";
import { listCertifications } from "@/lib/api/profile/certifications/list-certifications";
import { updateCertification } from "@/lib/api/profile/certifications/update-certification";

export function useEditProfileCertificationsController() {
  const { data: items = [] } = useQuery({
    queryKey: ["me", "certifications"],
    queryFn: listCertifications,
  });

  const props: SubListProps<Certification, CertificationRequest> = {
    items,
    fields: [
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
    ],
    createApi: createCertification,
    updateApi: updateCertification,
    deleteApi: deleteCertification,
    queryKey: ["me", "certifications"],
    emptyMessage: texts.profile.edit.emptyCertification,
    newItem: {
      name: "",
      issuer: "",
      description: "",
      issueDate: "",
      expirationDate: "",
      credentialUrl: "",
    },
  };

  return props;
}
