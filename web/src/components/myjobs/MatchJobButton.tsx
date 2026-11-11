"use client";
import {useT} from "@/i18n/useT";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useAgentChat } from "@/components/agent/AgentChatProvider";

// Shown in place of the score when a job has none. The match flag is read by
// useAutoMatch on the details page, which fires the AI match on arrival.
export function MatchJobButton({ jobId }: { jobId: string }) {
  const tr = useT();

  const { busy } = useAgentChat();

  // One shared conversation: a second match would clear the running one, so
  // the link is swapped for a dead button rather than left navigable.
  if (busy) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        disabled
        title={tr("m529a808b8ac0")}
      >
        <Sparkles className="h-3.5 w-3.5 me-1" />
        {tr("m03c0e806becb")}</Button>
    );
  }

  return (
    <Button asChild size="sm" variant="outline" className="shrink-0">
      <Link href={`/dashboard/myjobs/${jobId}?tab=match&match=1`}>
        <Sparkles className="h-3.5 w-3.5 me-1" />
        {tr("m03c0e806becb")}</Link>
    </Button>
  );
}
