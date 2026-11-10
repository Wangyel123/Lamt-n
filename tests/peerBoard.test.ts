import { describe, expect, it } from "vitest";
import { FEATURES } from "@/lib/features";
import { approvedPublic, makeAlias, moderationAdvice, postProblem, type BoardPost } from "@/lib/peerBoard";

const post = (id: string, status: BoardPost["status"], body = "Breathing slowly helps me before exams"): BoardPost => ({
  id,
  studentId: "S-012",
  topic: "Exam stress",
  body,
  alias: "Blue Mountain",
  status,
  createdAt: `2026-11-1${id}`,
});

describe("pre-moderated peer board (K-06)", () => {
  it("is switched OFF by default", () => {
    expect(FEATURES.peerBoard).toBe(false);
  });

  it("aliases are two friendly words, never a name or ID", () => {
    expect(makeAlias(() => 0)).toBe("Blue Mountain");
    expect(makeAlias()).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });

  it("only APPROVED posts are public, and the public view carries no student ID", () => {
    const pub = approvedPublic([post("1", "pending"), post("2", "approved"), post("3", "rejected")]);
    expect(pub.map((p) => p.id)).toEqual(["2"]);
    expect(JSON.stringify(pub)).not.toContain("S-012");
  });

  it("links are not allowed; empty or overlong posts are refused", () => {
    expect(postProblem("see https://example.com")).toMatch(/Links/);
    expect(postProblem("go to www.example")).toMatch(/Links/);
    expect(postProblem("my site is cool.com")).toMatch(/Links/);
    expect(postProblem("   ")).toMatch(/write something/);
    expect(postProblem("x".repeat(501))).toMatch(/under 500/);
    expect(postProblem("Talking to my sister helps")).toBeNull();
  });

  it("a post that may mention self-harm or abuse is never published: private follow-up instead", () => {
    expect(moderationAdvice({ body: "I want to hurt myself" })).toBe("follow_up_privately");
    expect(moderationAdvice({ body: "my uncle hit me" })).toBe("follow_up_privately");
    expect(moderationAdvice({ body: "Exams make me nervous" })).toBe("can_approve");
  });
});
