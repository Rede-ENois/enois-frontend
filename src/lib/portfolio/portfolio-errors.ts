import { texts } from "@/texts";

const BY_CODE: Record<string, string> = {
  MAX_PORTFOLIO_BLOCKS: texts.portfolio.blockLimit,
  PORTFOLIO_BLOCK_NOT_FOUND: texts.portfolio.blockMissing,
  PORTFOLIO_NOT_FOUND: texts.portfolio.notFound,
  PORTFOLIO_ORDER_INVALID: texts.portfolio.reorderError,
  PORTFOLIO_LINK_INVALID: texts.portfolio.linkInvalid,
  PORTFOLIO_BLOCK_CONTENT_REQUIRED: texts.portfolio.blockContentRequired,
  PORTFOLIO_BLOCK_TYPE_REQUIRED: texts.portfolio.blockTypeRequired,
  PORTFOLIO_BLOCK_PROJECT_INVALID: texts.portfolio.projectInvalid,
  PORTFOLIO_BLOCK_TITLE_TOO_LONG: texts.portfolio.titleTooLong,
  PORTFOLIO_BLOCK_TEXT_TOO_LONG: texts.portfolio.textTooLong,
  INVALID_PORTFOLIO_HTML: texts.portfolio.invalidPage,
};

/**
 * A recusa do servidor em texto. O código é a chave; a mensagem do backend entra quando o código é
 * desconhecido (API nova antes do app), para a pessoa ver alguma coisa útil e não um erro genérico.
 */
export function portfolioErrorText(code: string | undefined, message: string | undefined): string {
  return (code ? BY_CODE[code] : undefined) ?? message ?? texts.portfolio.savePageError;
}
