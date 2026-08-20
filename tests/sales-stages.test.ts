import {describe,expect,it} from "vitest";
import {SALES_STAGES,SALES_STAGE_LABELS} from "../src/lib/sales-stages";

describe("sales stages",()=>{it("has a readable label for every allowed value",()=>{expect(Object.keys(SALES_STAGE_LABELS)).toEqual([...SALES_STAGES]);expect(SALES_STAGE_LABELS.not_continuing).toBe("No continúa")})});
