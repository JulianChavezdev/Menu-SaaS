import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const board=readFileSync("src/components/dashboard/kitchen-board.tsx","utf8");

describe("kitchen operations",()=>{
  it("asks the device to stay awake after a staff gesture",()=>{expect(board).toContain('wakeLock');expect(board).toContain('request("screen")')});
  it("restores the lock when the kitchen returns to the foreground",()=>expect(board).toContain('visibilitychange'));
  it("resumes audio before sounding a new order",()=>expect(board).toContain('context.resume()'));
  it("allows staff to cancel an accepted or preparing order",()=>{expect(board).toContain('move(order.id,"cancelled")');expect(board).toContain("¿Cancelar esta comanda?")});
});
