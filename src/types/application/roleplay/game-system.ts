export type GameSystem = {
  id: string;
  label: string;
  systemFamily: string;
  author: string;
  license: string;
  attributes: {
    key: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
  }[];
};
