/**
 * A área de transferência não garante o tipo do arquivo: o clipboard do Android entrega
 * `image/jpg` (que não é um MIME válido) e alguns sistemas colam a imagem sem tipo nenhum.
 * O servidor recusa os dois antes de olhar os bytes (`MEDIA_TYPE_NOT_ALLOWED` /
 * `INVALID_MIME_TYPE`) — o suporte recebeu "tente enviar um JPG ou PNG" para uma imagem que
 * era um PNG de verdade. Aqui o tipo é consertado antes de o arquivo sair daqui: a assinatura
 * dos bytes manda, nunca a extensão nem o nome.
 */
export async function normalizeImageType(file: File): Promise<File> {
  if (file.type === "image/jpg") {
    return withType(file, "image/jpeg");
  }
  if (file.type) return file;

  const head = await readHead(file);
  const sniffed = head ? sniffImageType(new Uint8Array(head)) : null;
  return sniffed ? withType(file, sniffed) : file;
}

function readHead(file: File): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    // Sem os primeiros bytes não há o que consertar: o servidor decide com o tipo vazio.
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 256));
  });
}

function withType(file: File, type: string): File {
  return new File([file], file.name, { type, lastModified: file.lastModified });
}

/** Assinaturas dos formatos que o servidor aceita: PNG, JPEG, GIF, WEBP e SVG. */
function sniffImageType(head: Uint8Array): string | null {
  if (head.length >= 12) {
    const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
    if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
    if (ascii(0, 3) === "GIF") return "image/gif";
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(head).trimStart().toLowerCase();
  if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) {
    return "image/svg+xml";
  }
  return null;
}
