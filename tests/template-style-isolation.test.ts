import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("template style isolation", () => {
  it("keeps Marshmallow-only selectors inside its template root", () => {
    const css = readFileSync("src/components/menu/marshmallow-theme.css", "utf8");
    expect(css).not.toMatch(/(?:^|[}])\s*\.marshmallow-/m);
    expect(css).toMatch(/\.public-menu\[data-template="marshmallow"\]\s+\.marshmallow-category-ribbon/);
  });
});
