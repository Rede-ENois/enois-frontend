import { texts } from "@/texts";
import type { SupportCategory } from "@/types/application/support/support-category";
import {
  type SupportFormValues,
  SupportForm as SupportFormView,
} from "@rede-enois/design-system/domain";

import { ApiError, supportApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { useMediaUpload } from "@/lib/use-media-upload";

/**
 * Formulario de pedido de ajuda (atendimento humano). Fica num componente porque aparece em dois
 * lugares: a pagina /suporte (dentro do app) e a /contato (alcancavel sem login).
 */
export function SupportForm({ onSent }: { onSent?: () => void } = {}) {
  const currentUser = getCurrentUser();
  const imageUpload = useMediaUpload();

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const result = await imageUpload.upload(file, "POST_IMAGE");
      return result.cdnUrl;
    } catch {
      return null;
    }
  };

  const submit = async (values: SupportFormValues): Promise<string | null> => {
    try {
      await supportApi.open({
        subject: values.subject.trim(),
        message: values.message.trim(),
        contactEmail: values.contactEmail.trim(),
        category: values.category as SupportCategory,
        imageUrl: values.imageUrl,
      });
      onSent?.();
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : texts.support.error;
    }
  };

  return (
    <SupportFormView
      defaultContactEmail={currentUser?.email ?? ""}
      onUploadImage={uploadImage}
      onSubmit={submit}
    />
  );
}
