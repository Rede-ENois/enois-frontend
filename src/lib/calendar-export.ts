import { sessionHeaders } from "./api-client";

/**
 * Baixa o `.ics` da agenda com a sessão do app (cookie mais os headers de origem), sem passar
 * pelo cliente `api`: a resposta é arquivo, não JSON, e um 401 aqui não pode mandar ninguém
 * para o login por cima do download — a tela mostra o aviso e a agenda continua na tela.
 *
 * O caminho é o mesmo do cliente de agenda (`calendarApi.exportUrl`), recebido pronto, porque a
 * janela e o escopo que valem são os que a tela está mostrando.
 */
export async function downloadCalendarExport(url: string): Promise<void> {
  const response = await fetch(url, { credentials: "include", headers: sessionHeaders() });
  if (!response.ok) {
    throw new Error(`ics_export_failed_${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "agenda-enois.ics";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
