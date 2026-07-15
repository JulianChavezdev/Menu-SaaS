import {describe,expect,it} from "vitest";
import {cleanupHealth} from "../src/lib/operations-health";

const now=new Date("2026-07-15T12:00:00.000Z");
describe("salud de tareas automáticas",()=>{
  it("distingue pendiente, correcta, fallida y atrasada",()=>{
    expect(cleanupHealth(null,now)).toBe("pending");
    expect(cleanupHealth({action:"platform.trash_cleanup_completed",created_at:"2026-07-15T04:00:00.000Z"},now)).toBe("healthy");
    expect(cleanupHealth({action:"platform.trash_cleanup_failed",created_at:"2026-07-15T04:00:00.000Z"},now)).toBe("failed");
    expect(cleanupHealth({action:"platform.trash_cleanup_completed",created_at:"2026-07-13T00:00:00.000Z"},now)).toBe("stale");
  });
});
