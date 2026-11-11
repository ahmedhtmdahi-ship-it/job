import {message as uiMessage} from "@/i18n/message";
import prisma from "@/lib/db";
import { hashToken } from "./tokens";

type AuthSuccess = { ok: true; userId: string; scopes: string[]; tokenName: string };
type AuthFailure = { ok: false; status: 401 | 403; error: string };

export async function resolveMcpToken(req: Request): Promise<AuthSuccess | AuthFailure> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: uiMessage("m8656885fc382") };
  }

  const plaintext = authHeader.slice("Bearer ".length).trim();
  if (!plaintext) {
    return { ok: false, status: 401, error: uiMessage("m378eb14c628b") };
  }

  const tokenHash = hashToken(plaintext);
  const record = await prisma.mcpAccessToken.findUnique({ where: { tokenHash } });

  if (!record) {
    return { ok: false, status: 401, error: uiMessage("m086efea7640e") };
  }

  if (record.expiresAt < new Date()) {
    return { ok: false, status: 401, error: uiMessage("m605a25cfb239") };
  }

  // Fire-and-forget lastUsedAt update
  prisma.mcpAccessToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  let scopes: string[];
  try {
    scopes = JSON.parse(record.scopes) as string[];
  } catch {
    return { ok: false, status: 401, error: uiMessage("m71eeb771e668") };
  }
  return { ok: true, userId: record.userId, scopes, tokenName: record.name };
}
