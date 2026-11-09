import { readFileSync } from "node:fs";
import path from "node:path";
import { parseCsv, type Student } from "@/lib/parseCsv";

export function loadDataset() {
  const csv = readFileSync(path.join(process.cwd(), "data/SA_sample_dataset_SYNTHETIC.csv"), "utf8");
  return parseCsv(csv);
}

export function findStudent(students: Student[], id: string): Student {
  const s = students.find((x) => x.studentId === id);
  if (!s) throw new Error(`Student ${id} not found in dataset`);
  return s;
}

/** A student with all answers "fine", so each test changes only what it is testing. */
export function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    studentId: "T-001",
    school: "Test School",
    className: "VI",
    q1SleepWell: 4,
    q2SafeAtHome: 4,
    q3Bullied: "Never",
    q4TrustedAdult: "Yes",
    q5SadMostDays: "No",
    q6SelfHarm: "No",
    q7WantsCounsellor: "No",
    comment: "",
    dataIssues: [],
    fixes: [],
    ...overrides,
  };
}
