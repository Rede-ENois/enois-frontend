import type { PdfTextBlock } from "@/types/pdf/pdf-text-block";
import type { PdfTextItemLike } from "@/types/pdf/pdf-text-item-like";

function joinReflowLines(prevText: string, nextText: string): string {
  if (/[a-zà-úA-ZÀ-Ú]-$/.test(prevText) && /^[a-zà-ú]/.test(nextText)) {
    return `${prevText.slice(0, -1)}${nextText}`;
  }
  return `${prevText} ${nextText}`;
}

function isStandalonePageNumber(text: string, pageNumber?: number): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (pageNumber !== undefined && trimmed === String(pageNumber)) return true;
  return /^(página|pagina|page|pág\.?)\s*\d+(\s*(de|of|\/)\s*\d+)?$/i.test(trimmed);
}

/**
 * Extrai e estrutura os itens de texto de uma página do PDF em blocos semânticos
 * (títulos, subtítulos, parágrafos fluidos e listas) para leitura responsiva no mobile
 * no estilo Liquid Mode / Reader View, eliminando quebras de linha artificiais do A4.
 */
export function extractPdfPageBlocks(
  items: PdfTextItemLike[],
  pageNumber?: number,
): PdfTextBlock[] {
  const rawLines: Array<{
    text: string;
    x: number;
    endX: number;
    y: number;
    fontSize: number;
    forceBreakAfter: boolean;
  }> = [];

  let currentLine: {
    text: string;
    x: number;
    endX: number;
    y: number;
    fontSize: number;
    forceBreakAfter: boolean;
  } | null = null;

  for (const item of items) {
    if (typeof item.str !== "string") continue;
    const raw = item.str;
    const tx = Array.isArray(item.transform) ? item.transform : [12, 0, 0, 12, 0, 0];
    const x = typeof tx[4] === "number" ? tx[4] : 0;
    const y = typeof tx[5] === "number" ? tx[5] : 0;
    const scaleH =
      Math.hypot(typeof tx[0] === "number" ? tx[0] : 0, typeof tx[1] === "number" ? tx[1] : 0) ||
      Math.abs(typeof tx[3] === "number" ? tx[3] : 0);
    const fontSize = Math.max(
      1,
      typeof item.height === "number" && item.height > 0 ? item.height : scaleH || 12,
    );
    const width =
      typeof item.width === "number" && item.width >= 0 ? item.width : raw.length * fontSize * 0.5;
    const hasEOL = Boolean(item.hasEOL);

    if (raw.trim().length === 0) {
      if (currentLine && !currentLine.text.endsWith(" ")) {
        currentLine.text += " ";
      }
      if (hasEOL && currentLine) {
        currentLine.forceBreakAfter = true;
      }
      continue;
    }

    const sameY =
      currentLine !== null &&
      Math.abs(y - currentLine.y) <= Math.max(2.5, currentLine.fontSize * 0.42);

    if (currentLine && sameY && !currentLine.forceBreakAfter) {
      const gapX = x - currentLine.endX;
      const needSpace =
        gapX > currentLine.fontSize * 0.14 &&
        !currentLine.text.endsWith(" ") &&
        !raw.startsWith(" ");
      currentLine.text += (needSpace ? " " : "") + raw;
      currentLine.endX = Math.max(currentLine.endX, x + width);
      currentLine.fontSize = Math.max(currentLine.fontSize, fontSize);
      if (hasEOL) {
        currentLine.forceBreakAfter = true;
      }
    } else {
      if (currentLine && currentLine.text.trim().length > 0) {
        rawLines.push(currentLine);
      }
      currentLine = {
        text: raw,
        x,
        endX: x + width,
        y,
        fontSize,
        forceBreakAfter: hasEOL,
      };
    }
  }

  if (currentLine && currentLine.text.trim().length > 0) {
    rawLines.push(currentLine);
  }

  const lines = rawLines
    .map((line) => ({
      ...line,
      text: line.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((line) => line.text.length > 0);

  if (lines.length > 1 && isStandalonePageNumber(lines[0].text, pageNumber)) {
    lines.shift();
  }
  if (lines.length > 1 && isStandalonePageNumber(lines[lines.length - 1].text, pageNumber)) {
    lines.pop();
  }

  if (lines.length === 0) {
    return [];
  }

  const sortedSizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
  const bodyFontSize = sortedSizes[Math.floor(sortedSizes.length * 0.5)] || 12;

  const verticalGaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = Math.abs(lines[i - 1].y - lines[i].y);
    if (gap > 1 && gap < bodyFontSize * 5) {
      verticalGaps.push(gap);
    }
  }
  verticalGaps.sort((a, b) => a - b);
  const normalLineGap = verticalGaps[Math.floor(verticalGaps.length * 0.5)] || bodyFontSize * 1.25;

  const maxLineWidth = Math.max(...lines.map((l) => Math.max(10, l.endX - l.x)), 100);
  const minLeftX = Math.min(...lines.map((l) => l.x));

  const blocks: PdfTextBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : null;
    const gapBefore = prevLine ? Math.abs(prevLine.y - line.y) : normalLineGap * 2;
    const prevBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;

    const isBullet = /^([•●○▪▸▹–—*-]|\d{1,2}[.)]|[a-zA-Z][.)])\s+\S/.test(line.text);
    const isLargeHeading =
      !isBullet && line.fontSize >= bodyFontSize * 1.3 && line.text.length <= 160;
    const isSubHeading =
      !isBullet &&
      !isLargeHeading &&
      ((line.fontSize >= bodyFontSize * 1.13 && line.text.length <= 140) ||
        (/^(\d+(\.\d+)+\.?\s+[A-ZÀ-Ú]|#{1,4}\s+)/.test(line.text) && line.text.length <= 120));

    if (isLargeHeading) {
      const clean = line.text.replace(/^#{1,6}\s+/, "");
      if (
        prevBlock?.kind === "heading" &&
        prevLine &&
        gapBefore <= line.fontSize * 1.65 &&
        Math.abs(prevLine.fontSize - line.fontSize) < 1.5
      ) {
        prevBlock.text = joinReflowLines(prevBlock.text, clean);
      } else {
        blocks.push({ kind: "heading", text: clean });
      }
      continue;
    }

    if (isSubHeading) {
      const clean = line.text.replace(/^#{1,6}\s+/, "");
      if (
        prevBlock?.kind === "subheading" &&
        prevLine &&
        gapBefore <= line.fontSize * 1.65 &&
        Math.abs(prevLine.fontSize - line.fontSize) < 1.5
      ) {
        prevBlock.text = joinReflowLines(prevBlock.text, clean);
      } else {
        blocks.push({ kind: "subheading", text: clean });
      }
      continue;
    }

    if (isBullet) {
      const cleanBullet = line.text.replace(/^[•●○▪▸▹–—*-]\s+/, "");
      blocks.push({ kind: "list-item", text: cleanBullet });
      continue;
    }

    const hasVerticalGap = gapBefore > normalLineGap * 1.4;
    const prevLineShortAndEnded = prevLine
      ? prevLine.endX - prevLine.x < maxLineWidth * 0.72 && /[.!?:;”"']$/.test(prevLine.text)
      : true;
    const isIndented = line.x - minLeftX > bodyFontSize * 1.1;

    if (prevBlock?.kind === "list-item" && !hasVerticalGap && !prevLineShortAndEnded) {
      prevBlock.text = joinReflowLines(prevBlock.text, line.text);
    } else if (
      prevBlock?.kind === "paragraph" &&
      !hasVerticalGap &&
      !prevLineShortAndEnded &&
      !isIndented
    ) {
      prevBlock.text = joinReflowLines(prevBlock.text, line.text);
    } else {
      blocks.push({ kind: "paragraph", text: line.text });
    }
  }

  return blocks;
}
