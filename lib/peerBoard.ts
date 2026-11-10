// K-06: pre-moderated peer board (Kooth's model). Every post waits for a counsellor's approval,
// is shown without a name or ID (a random friendly alias), and has no links or images.
// Switched OFF by default in lib/features.ts.

import { needsAlert, scanText } from "./sensitiveText";

export type PostStatus = "pending" | "approved" | "rejected";

export interface BoardPost {
  id: string;
  studentId: string; // counsellors only; NEVER shown to other students
  topic: Topic;
  body: string;
  alias: string;
  status: PostStatus;
  createdAt: string;
}

export const TOPICS = ["Exam stress", "Friendships", "Things that help me"] as const;
export type Topic = (typeof TOPICS)[number];
export const POST_MAX_LENGTH = 500;

const COLOURS = ["Blue", "Green", "Golden", "Silver", "Quiet", "Bright", "Gentle", "Calm"];
const NATURE = ["Mountain", "River", "Pine", "Cloud", "Valley", "Lake", "Peak", "Meadow"];

/** A random friendly alias per post, e.g. "Blue Mountain". Never linked to the student on screen. */
export function makeAlias(random = Math.random): string {
  return `${COLOURS[Math.floor(random() * COLOURS.length)]} ${NATURE[Math.floor(random() * NATURE.length)]}`;
}

/** Students may not post links (safety) or empty/overlong text. Returns a reason, or null if fine. */
export function postProblem(body: string): string | null {
  const text = body.trim();
  if (!text) return "Please write something first.";
  if (text.length > POST_MAX_LENGTH) return `Please keep it under ${POST_MAX_LENGTH} characters.`;
  if (/(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|bt|io)\b)/i.test(text)) return "Links can't be shared on the board.";
  return null;
}

/**
 * Moderation advice for a pending post. A post that may mention self-harm or abuse is NEVER
 * published: it goes to the counsellor for a private, caring follow-up instead.
 */
export function moderationAdvice(post: Pick<BoardPost, "body">): "can_approve" | "follow_up_privately" {
  return needsAlert(scanText(post.body)) ? "follow_up_privately" : "can_approve";
}

/** What other students may see of an approved post: no student ID, ever. */
export interface PublicPost {
  id: string;
  topic: Topic;
  body: string;
  alias: string;
  createdAt: string;
}
export const toPublic = ({ id, topic, body, alias, createdAt }: BoardPost): PublicPost => ({ id, topic, body, alias, createdAt });
export const approvedPublic = (posts: BoardPost[]): PublicPost[] =>
  posts.filter((p) => p.status === "approved").map(toPublic).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
