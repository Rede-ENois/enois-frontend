import { texts } from "@/texts";

import { createCertification } from "@/lib/api/profile/certifications/create-certification";
import { deleteCertification } from "@/lib/api/profile/certifications/delete-certification";
import { listCertifications } from "@/lib/api/profile/certifications/list-certifications";
import { updateCertification } from "@/lib/api/profile/certifications/update-certification";
import { useProfileSubListController } from "@/utils/components/profile/use-profile-sub-list-controller";

export function useEditProfileCertificationsController() {
  return useProfileSubListController(["me", "certifications"], listCertifications, {
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
    emptyMessage: texts.profile.edit.emptyCertification,
    newItem: {
      name: "",
      issuer: "",
      description: "",
      issueDate: "",
      expirationDate: "",
      credentialUrl: "",
    },
  });
}
