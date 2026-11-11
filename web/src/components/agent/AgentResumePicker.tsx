"use client";

import {useT} from "@/i18n/useT";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgentChat } from "@/components/agent/AgentChatProvider";

// Radix Select, not ComboBox: a cmdk list inside a Sheet needs the popover
// scroll fix, and a handful of resumes does not need search.
export function AgentResumePicker({
  resumes,
  messageFor,
}: {
  resumes: { id: string; title: string }[];
  messageFor?: (title: string) => string;
}) {
  const tr = useT();

  const { sendMessage } = useAgentChat();

  // Sends the TITLE, never the id: the tool resolves names ownership-scoped,
  // and an id in the message stream is something the model could echo back.
  const pick = (id: string) => {
    const title = resumes.find((r) => r.id === id)?.title;
    if (!title) return;
    const text = messageFor ? messageFor(title) : `Review my resume "${title}"`;
    // The parts form, matching AgentChatInput — this surface always sends
    // parts, never a bare text shortcut.
    void sendMessage({ parts: [{ type: "text", text }] });
  };

  return (
    <Select onValueChange={pick}>
      <SelectTrigger aria-label={tr("mc971793dc97f")} className="mt-2 w-full">
        <SelectValue placeholder={tr("m4d2a8204fca9")} />
      </SelectTrigger>
      <SelectContent>
        {resumes.map((resume) => (
          <SelectItem key={resume.id} value={resume.id}>
            {resume.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
