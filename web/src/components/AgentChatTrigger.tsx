"use client";

import {useT} from "@/i18n/useT";
import { MessageSquare, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentChat } from "@/components/agent/AgentChatProvider";

export function AgentChatTrigger() {
  const tr = useT();

  const { isOpen, open, close, approvalPending } = useAgentChat();

  return (
    <Button
      variant="outline"
      className="relative"
      aria-label={isOpen ? tr("m5ff71d6b661c") : tr("md95e0aaca477")}
      onClick={() => (isOpen ? close() : open())}
    >
      {isOpen ? (
        <PanelRight className="h-4 w-4" />
      ) : (
        <>
          <MessageSquare className="h-4 w-4" />
          {tr("m521cd5ee5982")}</>
      )}
      {/* Deliberately no streaming state: nothing generates while the panel
          is closed, so there is no background activity to advertise. */}
      {approvalPending && (
        <span
          className="absolute end-1 top-1 h-2 w-2 rounded-full bg-primary"
          aria-label={tr("me16b1a168ac5")}
        />
      )}
    </Button>
  );
}
