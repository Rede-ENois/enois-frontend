import type { NetworkRequest } from "@rede-enois/design-system/domain";

/** An answered (or answering) invitation row and the place it had in the list. */
export type NetworkRequestOutcome = { row: NetworkRequest; index: number };
