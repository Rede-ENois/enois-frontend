/** A ready outfit of a collection: theme, frame, name style, effect, banner, plate, badges. */
export type LojaLook = {
  id: string;
  title: string;
  items: string[];
  statusIcon: string | null;
  statusText: string | null;
};
