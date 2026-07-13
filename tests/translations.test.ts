import {describe,expect,it} from "vitest";
import {mergeTranslation,translatedField} from "../src/lib/translations";

describe("content translations",()=>{
  it("merges a locale without deleting other languages",()=>{expect(mergeTranslation({fr:{name:"Carte"}},"en",{name:"Menu"})).toEqual({fr:{name:"Carte"},en:{name:"Menu"}})});
  it("removes an empty locale",()=>{expect(mergeTranslation({en:{name:"Menu"}},"en",{name:"  ",description:""})).toEqual({})});
  it("uses translated content when available",()=>{expect(translatedField({translations:{en:{name:"Cheesecake"}}},"name","en","Tarta de queso")).toBe("Cheesecake")});
  it("falls back to Spanish content",()=>{expect(translatedField({translations:{}},"name","en","Tarta de queso")).toBe("Tarta de queso");expect(translatedField({translations:{en:{name:"Cake"}}},"name","es","Tarta")).toBe("Tarta")});
});
