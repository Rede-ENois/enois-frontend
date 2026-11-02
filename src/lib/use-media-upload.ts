import { useCallback, useState } from "react";

import { texts } from "@/texts";
import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { UploadState } from "@/types/media-upload/upload-state";

import { ApiError, randomUUID } from "@/lib/api-client";
import { mediaApi } from "@/lib/api/media";

/**
 * Teto por arquivo: 500MB, o mesmo do servico (MediaService.MAX_MEDIA_BYTES). A checagem
 * aqui evita que a pessoa waited o upload inteiro para receber o erro do servidor; o servidor
 * continua sendo quem recusa de verdade.
 */
export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;

/** The API refuses a file type the upload purpose does not take: say it in plain words. */
export function uploadError(err: unknown): unknown {
  if (err instanceof ApiError && err.code === "MEDIA_TYPE_NOT_ALLOWED") {
    return new ApiError(
      err.status,
      err.code,
      texts.errors.knownCodes.MEDIA_TYPE_NOT_ALLOWED,
      err.path,
    );
  }
  if (err instanceof ApiError && err.code === "IMAGE_CONTENT_NOT_ALLOWED") {
    return new ApiError(
      err.status,
      err.code,
      texts.errors.knownCodes.IMAGE_CONTENT_NOT_ALLOWED,
      err.path,
    );
  }
  if (err instanceof ApiError && err.code === "IMAGE_CANNOT_BE_VERIFIED") {
    return new ApiError(
      err.status,
      err.code,
      texts.errors.knownCodes.IMAGE_CANNOT_BE_VERIFIED,
      err.path,
    );
  }
  if (err instanceof ApiError && err.code === "IMAGE_MODERATION_UNAVAILABLE") {
    return new ApiError(
      err.status,
      err.code,
      texts.errors.knownCodes.IMAGE_MODERATION_UNAVAILABLE,
      err.path,
    );
  }
  return err;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function genFileName(file: File): string {
  const key = randomUUID();
  return `media/${key}/${sanitizeName(file.name)}`;
}

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });

  const upload = useCallback(async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
    if (file.size > MAX_MEDIA_BYTES) {
      const error = new Error(
        `O arquivo tem mais de ${MAX_MEDIA_BYTES / (1024 * 1024)}MB. O limite por arquivo é ${
          MAX_MEDIA_BYTES / (1024 * 1024)
        }MB.`,
      );
      setState({ status: "error", progress: 0, error: error.message });
      throw error;
    }

    setState({ status: "uploading", progress: 0 });

    try {
      const fileName = genFileName(file);
      const { id, cdnUrl, uploadUrl, provider, uploadHeaders } = await mediaApi.requestUpload({
        fileName,
        mimeType: file.type,
        size: file.size,
        purpose,
      });

      // O servidor diz para onde subir: com S3 é uma URL assinada (PUT direto); sem isso, o fluxo
      // multipart do ImageKit de sempre. O front não adivinha pelo formato da URL.
      if (provider !== "S3") {
        throw new Error(
          "O envio de mídia está temporariamente desativado enquanto o armazenamento é migrado.",
        );
      }
      await mediaApi.uploadToSignedUrl(uploadUrl, file, uploadHeaders ?? {});

      setState({ status: "done", progress: 100 });
      return { mediaId: id, cdnUrl };
    } catch (caught) {
      const err = uploadError(caught);
      const msg = err instanceof Error ? err.message : "Upload falhou";
      setState({ status: "error", progress: 0, error: msg });
      throw err;
    }
  }, []);

  const uploadAll = useCallback(async (files: UploadInput[]): Promise<UploadResult[]> => {
    if (files.length === 0) return [];
    setState({ status: "uploading", progress: 0 });

    const results: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const { file, purpose = "POST_IMAGE" } = files[i];
      if (file.size > MAX_MEDIA_BYTES) {
        const error = new Error(
          `O arquivo "${file.name}" tem mais de ${MAX_MEDIA_BYTES / (1024 * 1024)}MB. O limite por arquivo é ${
            MAX_MEDIA_BYTES / (1024 * 1024)
          }MB.`,
        );
        setState({ status: "error", progress: 0, error: error.message });
        throw error;
      }
      try {
        const fileName = genFileName(file);
        const { id, cdnUrl, uploadUrl, provider, uploadHeaders } = await mediaApi.requestUpload({
          fileName,
          mimeType: file.type,
          size: file.size,
          purpose,
        });
        // Mesma bifurcação do upload avulso: quem manda no caminho é o provedor que o servidor
        // respondeu, não o formato da URL. Aqui subia sempre pelo ImageKit — com o storage em S3,
        // o compositor (que usa este caminho para TODOS os anexos) falhava.
        if (provider !== "S3") {
          throw new Error(
            "O envio de mídia está temporariamente desativado enquanto o armazenamento é migrado.",
          );
        }
        await mediaApi.uploadToSignedUrl(uploadUrl, file, uploadHeaders ?? {});
        results.push({ mediaId: id, cdnUrl });
        setState((s) => ({ ...s, progress: Math.round(((i + 1) / files.length) * 100) }));
      } catch (caught) {
        const err = uploadError(caught);
        const msg = err instanceof Error ? err.message : "Upload falhou";
        setState({ status: "error", progress: 0, error: msg });
        throw err;
      }
    }

    setState({ status: "done", progress: 100 });
    return results;
  }, []);

  return { ...state, upload, uploadAll };
}
