import type { DeleteResult } from "./delete-result";

export type BulkDeleteResult = {
  status: string;
  results: DeleteResult[];
};
