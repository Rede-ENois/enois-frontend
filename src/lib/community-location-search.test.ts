import { describe, expect, it } from "vitest";

import { parseCommunityLocationSearch } from "./community-location-search";

describe("parseCommunityLocationSearch", () => {
  it("keeps a known UF with or without a city", () => {
    expect(parseCommunityLocationSearch({ uf: "mg", cidade: " Belo Horizonte " })).toEqual({
      uf: "MG",
      cidade: "Belo Horizonte",
    });
    expect(parseCommunityLocationSearch({ uf: "SP" })).toEqual({ uf: "SP" });
  });

  it("drops a city without a UF and an unknown UF", () => {
    expect(parseCommunityLocationSearch({ cidade: "Bom Jesus" })).toEqual({});
    expect(parseCommunityLocationSearch({ uf: "XX", cidade: "Lugar" })).toEqual({});
    expect(parseCommunityLocationSearch({ uf: 31 })).toEqual({});
  });
});
