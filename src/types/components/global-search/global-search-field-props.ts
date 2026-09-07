import type { FocusEventHandler, RefObject } from "react";

export type GlobalSearchFieldProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  isFetching: boolean;
  onQueryChange: (value: string) => void;
  onFocus: FocusEventHandler<HTMLInputElement>;
};
