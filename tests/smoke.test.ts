// Phase 0 smoke test: proves the test runner and the CSV are wired up.
// Real rule/parser/suppression tests arrive in Phases 1 and 3.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getMode } from "@/lib/mode";

describe("project setup", () => {
  it("finds the synthetic dataset with 72 student rows", () => {
    const csv = readFileSync(path.join(process.cwd(), "data/SA_sample_dataset_SYNTHETIC.csv"), "utf8");
    const rows = csv.trim().split(/\r?\n/).slice(1);
    expect(rows).toHaveLength(72);
  });

  it("defaults to demo mode when no Supabase env vars are set", () => {
    expect(getMode()).toBe("demo");
  });
});
