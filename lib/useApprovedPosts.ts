"use client";

// Approved board posts, as OTHER students may see them: no student IDs.
// Demo: filter the local list. Live: the approved_board_posts() database function, which returns
// only approved posts from the student's own school, without student IDs.

import { useEffect, useState } from "react";
import { isDemoMode } from "./mode";
import { approvedPublic, type PublicPost } from "./peerBoard";
import { boardPosts } from "./stores";
import { getBrowserSupabase } from "./supabase/client";

export function useApprovedPosts(): PublicPost[] {
  const local = boardPosts.use();
  const [live, setLive] = useState<PublicPost[]>([]);
  useEffect(() => {
    if (isDemoMode()) return;
    void getBrowserSupabase()
      .rpc("approved_board_posts")
      .then(({ data }: { data: unknown }) =>
        setLive(((data ?? []) as Record<string, string>[]).map((r) => ({ id: r.id, topic: r.topic as PublicPost["topic"], body: r.body, alias: r.alias, createdAt: r.created_at }))),
      );
  }, []);
  return isDemoMode() ? approvedPublic(local.items) : live;
}
