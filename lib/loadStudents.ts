// SERVER ONLY: reads the synthetic CSV from disk (demo mode).
// Importing this from a client component would fail the build, because
// browsers have no file system. That is intentional.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv, type ParseResult } from "./parseCsv";

export const CSV_PATH = path.join(process.cwd(), "data", "SA_sample_dataset_SYNTHETIC.csv");

export async function loadStudentsFromCsv(): Promise<ParseResult> {
  // The demo CSV never changes while the app runs, so Next.js can cache the parsed
  // result and prerender the page (required because cacheComponents is on).
  "use cache";
  const text = await readFile(CSV_PATH, "utf8");
  return parseCsv(text);
}
