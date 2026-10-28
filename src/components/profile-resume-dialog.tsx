import { useMutation } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileResumeDialogProps } from "@/types/components/profile/profile-resume-dialog-props";
import { ProfileResumeDialog as ProfileResumeDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { profileApi } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";

/**
 * Currículo do perfil: subir um PDF, baixar o que está lá e remover.
 *
 * O arquivo vive no storage de mídia (como avatar e emblema) e o perfil guarda só o endereço e o
 * nome original — é o nome que faz o download sair como "curriculo-ana.pdf" em vez de um id do CDN.
 */
export function ProfileResumeDialog({ resumeUrl, resumeName, onSaved }: ProfileResumeDialogProps) {
  const { toast } = useToast();
  const upload = useMediaUpload();

  const save = useMutation({
    mutationFn: (data: { resumeUrl: string; resumeName: string }) => profileApi.update(data),
    onSuccess: (_result, variables) => {
      toast(variables.resumeUrl === "" ? texts.profile.resume.removed : texts.profile.resume.saved);
      onSaved();
    },
    onError: () => toast(texts.profile.resume.error, "error"),
  });

  const handleUpload = async (file: File) => {
    try {
      const result = await upload.upload(file, "RESUME");
      await save.mutateAsync({ resumeUrl: result.cdnUrl, resumeName: file.name });
    } catch {
      toast(texts.profile.resume.error, "error");
    }
  };

  return (
    <ProfileResumeDialogView
      resumeUrl={resumeUrl}
      resumeName={resumeName}
      busy={upload.status === "uploading" || save.isPending}
      onUpload={(file) => void handleUpload(file)}
      onRemove={() => save.mutate({ resumeUrl: "", resumeName: "" })}
    />
  );
}
