import { afterEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();

vi.mock("../api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api-client")>();
  return {
    ...actual,
    api: {
      get: (path: string): unknown => get(path),
      post: (path: string, body: unknown): unknown => post(path, body),
    },
  };
});

const { adminEntitiesApi } = await import("./admin-entities");

describe("adminEntitiesApi", () => {
  afterEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("lists community members with the search and the page in the query", async () => {
    await adminEntitiesApi.communityMembers("com_1", "ana silva", 2);
    expect(get).toHaveBeenCalledWith(
      "/admin/moderation/communities/com_1/members?q=ana+silva&page=2&size=25",
    );
  });

  it("leaves an empty search out of the query", async () => {
    await adminEntitiesApi.groupMembers("grp_1", "", 0);
    expect(get).toHaveBeenCalledWith("/admin/moderation/groups/grp_1/members?page=0&size=25");
  });

  it("deletes a community and a group by POST with the reason in the body", async () => {
    const reason = "Decisão da administração da plataforma.";
    await adminEntitiesApi.deleteCommunity("com_1", reason);
    expect(post).toHaveBeenCalledWith("/admin/moderation/communities/com_1/delete", { reason });

    await adminEntitiesApi.deleteGroup("grp_1", reason);
    expect(post).toHaveBeenCalledWith("/admin/moderation/groups/grp_1/delete", { reason });
  });

  it("closes a group without deleting its content", async () => {
    await adminEntitiesApi.closeGroup("grp_1", "Histórico preservado por decisão.");
    expect(post).toHaveBeenCalledWith("/admin/moderation/groups/grp_1/close", {
      reason: "Histórico preservado por decisão.",
    });
  });

  it("removes a member with the reason, escaping the identifiers", async () => {
    await adminEntitiesApi.removeGroupMember("grp 1", "user/2", "Remoção administrativa do grupo.");
    expect(post).toHaveBeenCalledWith("/admin/moderation/groups/grp%201/members/user%2F2/remove", {
      reason: "Remoção administrativa do grupo.",
    });
  });
});
