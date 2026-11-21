export type PdfTextBlock = {
  kind: "heading" | "subheading" | "paragraph" | "list-item";
  text: string;
};
