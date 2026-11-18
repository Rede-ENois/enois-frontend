import type { AdminMemberPage } from "@/types/application/admin-entity/admin-member-page";
import { describe, expect, it } from "vitest";

import { adminMemberRows, roleLabel } from "./admin-members-view";

const page: AdminMemberPage = {
  entityId: "grp_1",
  name: "Grupo",
  total: 3,
  page: 0,
  size: 25,
  pages: 1,
  items: [
    {
      userId: "u1",
      username: "ana",
      name: "Ana Souza",
      avatar: null,
      role: "OWNER",
      joinedAt: "2026-10-18T13:00:00Z",
    },
    {
      userId: "u2",
      username: null,
      name: null,
      avatar: "/media/a.png",
      role: "MEMBER",
      joinedAt: null as unknown as string,
    },
    {
      userId: "u3",
      username: "bruno",
      name: "Bruno",
      avatar: null,
      // Papel que o front ainda não conhece (o backend pode ganhar um novo): aparece como veio.
      role: "AUDITOR",
      joinedAt: "2026-03-02T12:00:00Z",
    },
  ],
};

const groupRoles = {
  OWNER: "Dono",
  ADMIN: "Administrador",
  MODERATOR: "Moderador",
  MEMBER: "Membro",
};

describe("adminMemberRows", () => {
  it("maps each member to the view model with the localized role and join date", () => {
    const rows = adminMemberRows(page, groupRoles);

    expect(rows[0]).toEqual({
      userId: "u1",
      username: "ana",
      name: "Ana Souza",
      avatar: null,
      roleLabel: "Dono",
      joinedAtLabel: expect.stringContaining("2026"),
    });
    expect(rows[1].joinedAtLabel).toBe("");
  });

  it("keeps an unknown role visible instead of hiding the member", () => {
    expect(adminMemberRows(page, groupRoles)[2].roleLabel).toBe("AUDITOR");
  });

  it("returns nothing when the page did not arrive yet", () => {
    expect(adminMemberRows(undefined, groupRoles)).toEqual([]);
  });
});

describe("roleLabel", () => {
  it("falls back to the raw role when there is no translation", () => {
    expect(roleLabel("ADMIN", groupRoles)).toBe("Administrador");
    expect(roleLabel("NOVO", groupRoles)).toBe("NOVO");
  });
});
