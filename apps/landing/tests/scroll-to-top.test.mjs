import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const scrollToTopSource = readFileSync(
  new URL("../src/components/ScrollToTop.tsx", import.meta.url),
  "utf8",
);

test("App renders ScrollToTop inside the router route tree", () => {
  assert.match(appSource, /import ScrollToTop from "\.\/components\/ScrollToTop"/);
  assert.match(appSource, /<ScrollToTop\s*\/>/);
});

test("ScrollToTop scrolls to the page top when the route pathname changes", () => {
  assert.match(scrollToTopSource, /useLocation\(\)/);
  assert.match(scrollToTopSource, /pathname/);
  assert.match(scrollToTopSource, /window\.scrollTo\(\{\s*top:\s*0,\s*left:\s*0,\s*behavior:\s*"auto"/s);
});
