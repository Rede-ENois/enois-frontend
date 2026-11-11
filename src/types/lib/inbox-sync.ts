import type { InfiniteData } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";

/** Consulta infinita de página: o formato que a sincronia da caixa sabe atualizar. */
export type Paged<T> = InfiniteData<PageResponse<T>, string | null>;
