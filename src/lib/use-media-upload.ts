import { useCallback, useRef, useState } from "react";

import { texts } from "@/texts";
import type { UploadFileState } from "@/types/media-upload/upload-file-state";
import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { UploadState } from "@/types/media-upload/upload-state";
import type { UploadStatus } from "@/types/media-upload/upload-status";

import { ApiError, randomUUID } from "@/lib/api-client";
import { mediaApi } from "@/lib/api/media";

/**
 * Teto por arquivo: 500MB, o mesmo do servico (MediaService.MAX_MEDIA_BYTES). A checagem
 * aqui evita que a pessoa waited o upload inteiro para receber o erro do servidor; o servidor
 * continua sendo quem recusa de verdade.
 */
export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;

/**
 * Códigos de erro do upload que têm texto próprio no app. O servidor manda a mensagem dele, mas
 * ela é técnica ("Arquivo grande demais para a limpeza de metadados") ou fala de infraestrutura;
 * aqui a pessoa lê o que aconteceu e o que fazer.
 */
const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  MEDIA_TYPE_NOT_ALLOWED: texts.errors.knownCodes.MEDIA_TYPE_NOT_ALLOWED,
  IMAGE_CONTENT_NOT_ALLOWED: texts.errors.knownCodes.IMAGE_CONTENT_NOT_ALLOWED,
  IMAGE_CANNOT_BE_VERIFIED: texts.errors.knownCodes.IMAGE_CANNOT_BE_VERIFIED,
  IMAGE_MODERATION_UNAVAILABLE: texts.errors.knownCodes.IMAGE_MODERATION_UNAVAILABLE,
  MEDIA_TOO_LARGE: texts.errors.knownCodes.MEDIA_TOO_LARGE,
  MEDIA_SIZE_MISMATCH: texts.errors.knownCodes.MEDIA_SIZE_MISMATCH,
  MEDIA_UPLOAD_FAILED: texts.errors.knownCodes.MEDIA_UPLOAD_FAILED,
  MEDIA_UPLOAD_UNAVAILABLE: texts.errors.knownCodes.MEDIA_UPLOAD_UNAVAILABLE,
  MEDIA_STORAGE_WRITE_FAILED: texts.errors.knownCodes.MEDIA_STORAGE_WRITE_FAILED,
  MEDIA_STORAGE_DISABLED: texts.errors.knownCodes.MEDIA_STORAGE_DISABLED,
  // O restante do mapa de mídia fica de fora de propósito: MEDIA_LENGTH_REQUIRED é 411 por falta de
  // Content-Length, que depende do navegador e não do arquivo; os outros (MEDIA_FORBIDDEN,
  // MEDIA_NOT_FOUND, MEDIA_KEY_MISMATCH, MEDIA_OWNER_MISMATCH, MEDIA_INVALID_KEY) descrevem o
  // asset ou a chave, não o envio, e o app não os recebe no caminho de upload.
};

/** Troca a mensagem técnica do servidor pela explicação do app, mantendo código e status. */
export function uploadError(err: unknown): unknown {
  if (err instanceof ApiError && err.code) {
    const message = UPLOAD_ERROR_MESSAGES[err.code];
    if (message) {
      return new ApiError(err.status, err.code, message, err.path);
    }
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

/** Chave estável do arquivo: o progresso e o estado por arquivo usam-na como identificador. */
export function mediaFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function emptyFileState(): UploadFileState {
  return { status: "idle", progress: 0 };
}

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0, files: {} });
  const inFlight = useRef<Map<string, Promise<UploadResult>>>(new Map());
  const controllers = useRef<Map<string, AbortController>>(new Map());

  const patchFile = useCallback((key: string, patch: Partial<UploadFileState>) => {
    setState((atual) => ({
      ...atual,
      files: { ...atual.files, [key]: { ...(atual.files[key] ?? emptyFileState()), ...patch } },
    }));
  }, []);

  const patchState = useCallback((patch: Partial<UploadState>) => {
    setState((atual) => ({ ...atual, ...patch }));
  }, []);

  const runUpload = useCallback(
    async (file: File, purpose: string, key: string): Promise<UploadResult> => {
      const controller = new AbortController();
      controllers.current.set(key, controller);
      try {
        setState((atual) => ({ ...atual, status: "uploading", progress: 0, error: undefined }));
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
        await mediaApi.uploadToSignedUrl(
          uploadUrl,
          file,
          uploadHeaders ?? {},
          (percent) => {
            setState((atual) =>
              atual.status === "uploading" ? { ...atual, progress: percent } : atual,
            );
          },
          controller.signal,
        );

        setState((atual) => ({ ...atual, status: "done", progress: 100, error: undefined }));
        return { mediaId: id, cdnUrl };
      } catch (caught) {
        const err = uploadError(caught);
        const msg = err instanceof Error ? err.message : "Upload falhou";
        setState((atual) => ({ ...atual, status: "error", progress: 0, error: msg }));
        throw err;
      } finally {
        controllers.current.delete(key);
      }
    },
    [],
  );

  const upload = useCallback(
    async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
      const key = mediaFileKey(file);
      const existente = inFlight.current.get(key);
      if (existente) {
        // Mesma subida em andamento (duplo clique, envio repetido): devolve o mesmo pedido, sem
        // subir o arquivo duas vezes.
        return existente;
      }
      const promessa = runUpload(file, purpose, key)
        .then(
          (resultado) => {
            patchFile(key, { status: "done", progress: 100 });
            return resultado;
          },
          (caught) => {
            const err = uploadError(caught);
            patchFile(key, {
              status: "error",
              progress: 0,
              error: err instanceof Error ? err.message : "Upload falhou",
            });
            throw err;
          },
        )
        .finally(() => {
          inFlight.current.delete(key);
        });
      inFlight.current.set(key, promessa);
      return promessa;
    },
    [runUpload, patchFile],
  );

  const uploadAll = useCallback(
    async (files: UploadInput[]): Promise<UploadResult[]> => {
      if (files.length === 0) return [];
      patchState({ status: "uploading", progress: 0, error: undefined });

      const resultados: UploadResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const { file, purpose = "POST_IMAGE" } = files[i];
        const key = mediaFileKey(file);
        if (file.size > MAX_MEDIA_BYTES) {
          const error = new Error(
            `O arquivo "${file.name}" tem mais de ${MAX_MEDIA_BYTES / (1024 * 1024)}MB. O limite por arquivo é ${
              MAX_MEDIA_BYTES / (1024 * 1024)
            }MB.`,
          );
          patchFile(key, { status: "error", progress: 0, error: error.message });
          patchState({ status: "error", progress: 0, error: error.message });
          throw error;
        }
        try {
          patchFile(key, { status: "uploading", progress: 0, error: undefined });
          patchState({ status: "uploading", progress: 0, error: undefined });
          const resultado = await upload(file, purpose);
          patchFile(key, { status: "done", progress: 100 });
          resultados.push(resultado);
          patchState({
            status: "uploading",
            progress: Math.round(((i + 1) / files.length) * 100),
          });
        } catch (caught) {
          const err = uploadError(caught);
          const msg = err instanceof Error ? err.message : "Upload falhou";
          patchFile(key, { status: "error", progress: 0, error: msg });
          patchState({ status: "error", progress: 0, error: msg });
          throw err;
        }
      }

      patchState({ status: "done", progress: 100, error: undefined });
      return resultados;
    },
    [upload, patchFile, patchState],
  );

  /** Cancela o(s) upload(s) em andamento (o XHR suporta abort; o resto do fluxo segue). */
  const cancel = useCallback((chave?: string) => {
    const alvos =
      chave != null
        ? [chave]
        : Array.from(controllers.current.keys()).filter((k) => controllers.current.has(k));
    for (const key of alvos) {
      controllers.current.get(key)?.abort();
      controllers.current.delete(key);
    }
  }, []);

  const status: UploadStatus = state.status;
  const progress = state.progress;

  /** Volta ao estado inicial (por exemplo, depois que a publicação concluiu com sucesso). */
  const reset = useCallback(() => {
    inFlight.current.clear();
    controllers.current.clear();
    setState({ status: "idle", progress: 0, error: undefined, files: {} });
  }, []);

  return { ...state, status, progress, upload, uploadAll, cancel, reset };
}
