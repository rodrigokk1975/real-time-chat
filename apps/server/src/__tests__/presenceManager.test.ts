import { describe, it, expect } from "vitest";
import { PresenceManager } from "../modules/socket/presenceManager.js";

describe("PresenceManager", () => {
  it("keeps user online in room until all their sockets leave or disconnect", () => {
    const pm = new PresenceManager();
    const alice = { id: "u1", name: "Alice" };

    pm.joinRoom("r1", alice, "s1");
    pm.joinRoom("r1", alice, "s2");

    expect(pm.getConnectionCount("u1")).toBe(2);
    expect(pm.getRoomUsers("r1")).toEqual([alice]);

    // Closing tab 1 keeps Alice online in room r1
    const affectedAfterS1 = pm.disconnectSocket("u1", "s1");
    expect(affectedAfterS1).toEqual(["r1"]);
    expect(pm.isUserOnline("u1")).toBe(true);
    expect(pm.getRoomUsers("r1")).toEqual([alice]);

    // Closing tab 2 removes Alice from room r1
    const affectedAfterS2 = pm.disconnectSocket("u1", "s2");
    expect(affectedAfterS2).toEqual(["r1"]);
    expect(pm.isUserOnline("u1")).toBe(false);
    expect(pm.getRoomUsers("r1")).toEqual([]);
  });

  it("isolates presence per room and sorts users by name", () => {
    const pm = new PresenceManager();
    pm.joinRoom("r1", { id: "u2", name: "Bruno" }, "s2");
    pm.joinRoom("r1", { id: "u1", name: "Ana" }, "s1");
    pm.joinRoom("r2", { id: "u3", name: "Carla" }, "s3");

    expect(pm.getRoomUsers("r1")).toEqual([
      { id: "u1", name: "Ana" },
      { id: "u2", name: "Bruno" },
    ]);
    expect(pm.getRoomUsers("r2")).toEqual([{ id: "u3", name: "Carla" }]);

    pm.leaveRoom("r1", "u2", "s2");
    expect(pm.getRoomUsers("r1")).toEqual([{ id: "u1", name: "Ana" }]);
  });
});
