import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { apiErrorCode } from "./api-error-code";

describe("apiErrorCode", () => {
  it("devolve o código do erro da API", () => {
    expect(apiErrorCode(new ApiError(409, "TOPIC_EXISTS", "já existe"))).toBe("TOPIC_EXISTS");
  });

  it("erro da API sem código vira null", () => {
    expect(apiErrorCode(new ApiError(500, undefined, "erro"))).toBeNull();
  });

  it("erro comum (rede, bug) vira null", () => {
    expect(apiErrorCode(new Error("falhou"))).toBeNull();
    expect(apiErrorCode("x")).toBeNull();
  });
});
