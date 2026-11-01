/**
 * What the professional profile query says. "No data" is not "no profile": while it loads or when
 * it failed the app does not know, and must not act as if the person had none.
 */
export type ProfessionalProfileState = "LOADING" | "ERROR" | "ACTIVE" | "NOT_READY";
