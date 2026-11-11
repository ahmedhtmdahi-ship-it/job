"use client";

import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useAgentChat } from "@/components/agent/AgentChatProvider";
import { AGENT_ADD_JOB_INTRO } from "@/lib/agent/prompt";

// None need editing first, so they act on click. "Review resume" runs a real
// turn. "Match a job" and "Generate cover letter" have no page context here,
// so the tools reply with a graceful "no_job" result telling the user to open
// a job's page first. ADD_JOB is the one whose answer is knowable without the
// model — see AGENT_ADD_JOB_INTRO.
const ADD_JOB = uiMessage("md5d347c59721");
const EXAMPLES = [
  ADD_JOB,
  uiMessage("mca9bfcad5ad9"),
  uiMessage("m2b762629e1bc"),
  uiMessage("m499e4a7f5e17"),
];

export function AgentChatEmptyState() {
  const tr = useT();

  const { sendMessage, seedExchange, preflight } = useAgentChat();

  const handleClick = (example: string) => {
    if (!preflight.ok) return;
    if (example === ADD_JOB) {
      seedExchange(example, AGENT_ADD_JOB_INTRO);
      return;
    }
    void sendMessage({ parts: [{ type: "text", text: example }] });
  };

  return (
    <div className="flex flex-1 flex-col justify-end gap-4 p-4">
      {/* Stated up front rather than left to the model to confess: a local 8B
          asked what it can do will happily invent capabilities. */}
      <p className="text-sm text-muted-foreground">
        {tr("mc28b8e487a91")}</p>

      <Suggestions>
        {EXAMPLES.map((example) => (
          <Suggestion
            disabled={!preflight.ok}
            key={example}
            onClick={handleClick}
            suggestion={example}
          />
        ))}
      </Suggestions>
    </div>
  );
}
