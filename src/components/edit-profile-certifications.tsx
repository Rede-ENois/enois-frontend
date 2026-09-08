import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import { useEditProfileCertificationsController } from "@/utils/components/profile/use-edit-profile-certifications-controller";

import { SubList } from "@/components/edit-profile-sub-list";

export function EditProfileCertifications() {
  const props = useEditProfileCertificationsController();

  return <SubList<Certification, CertificationRequest> {...props} />;
}
