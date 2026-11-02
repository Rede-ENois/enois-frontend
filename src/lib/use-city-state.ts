import { useState } from "react";

import { useMessages } from "@rede-enois/design-system";
import {
  type CityStateErrorCode,
  type CityStateValue,
  validateCityState,
} from "@rede-enois/design-system/patterns";

import { ApiError } from "./api-client";

const CITY_STATE_ERROR_CODES: ReadonlySet<string> = new Set<CityStateErrorCode>([
  "CITY_STATE_INCOMPLETE",
  "INVALID_STATE",
  "CITY_TOO_LONG",
]);

/** The backend location code behind a rejected request, or null when the error is about something else. */
export function cityStateErrorCode(error: unknown): CityStateErrorCode | null {
  return error instanceof ApiError && error.code && CITY_STATE_ERROR_CODES.has(error.code)
    ? (error.code as CityStateErrorCode)
    : null;
}

/**
 * Form state for the design system `CityStateField`: same rules as the backend before sending
 * (`validate`), and the server's location codes shown under the field (`serverError`). Editing the
 * field dismisses the server error it was showing.
 */
export function useCityState(
  initial?: { city?: string | null; state?: string | null } | null,
  serverError?: unknown,
) {
  const messages = useMessages().cityStateField;
  const [value, setValue] = useState<CityStateValue>({
    city: initial?.city ?? "",
    state: initial?.state ?? "",
  });
  const [localCode, setLocalCode] = useState<CityStateErrorCode | null>(null);
  const [dismissed, setDismissed] = useState<unknown>(null);
  const code = localCode ?? (serverError === dismissed ? null : cityStateErrorCode(serverError));

  return {
    value,
    /** Spread into `CityStateField`. */
    field: {
      value,
      error: code ? messages.errors[code] : null,
      onChange: (next: CityStateValue) => {
        setValue(next);
        setLocalCode(null);
        setDismissed(serverError);
      },
    },
    /** Checks the pair before sending; false keeps the form open with the message. */
    validate: () => {
      const next = validateCityState(value);
      setLocalCode(next);
      return next === null;
    },
    /** Body fields: both empty strings clear the place on PATCH, absent keeps it. */
    payload: { city: value.city.trim(), state: value.state },
    reset: (next: CityStateValue = { city: "", state: "" }) => {
      setValue(next);
      setLocalCode(null);
    },
  };
}
