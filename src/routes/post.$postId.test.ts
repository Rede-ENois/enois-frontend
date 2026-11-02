import { describe, expect, it } from "vitest";

import { Route } from "./post.$postId";

const validate = (search: Record<string, unknown>) =>
  (Route.options.validateSearch as (search: Record<string, unknown>) => { reacoes?: true })(search);

describe("/post/$postId search", () => {
  it("opens the list of who reacted from a grouped notification", () => {
    expect(validate({ reacoes: "1" }).reacoes).toBe(true);
    expect(validate({ reacoes: 1 }).reacoes).toBe(true);
  });

  it("keeps it closed otherwise", () => {
    expect(validate({}).reacoes).toBeUndefined();
    expect(validate({ reacoes: "nao" }).reacoes).toBeUndefined();
  });
});
