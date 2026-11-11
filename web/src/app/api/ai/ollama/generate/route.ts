import {message as uiMessage} from "@/i18n/message";
import { auth } from "@/auth";
import { getOllamaBaseUrl } from "@/actions/apiKey.actions";
import { NextResponse } from "next/server";
import { APP_CONSTANTS } from "@/lib/constants";
import { log } from "@/lib/telemetry";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: uiMessage("md089c8a9fc28") }, { status: 401 });
    }

    const body = await request.json();
    const baseUrl = await getOllamaBaseUrl();
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(APP_CONSTANTS.AI_OLLAMA_GENERATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: uiMessage("m97a824806266") },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error proxying Ollama generate", {
      provider: "ollama",
      error: String(error),
    });
    return NextResponse.json(
      { error: uiMessage("m738de92f5866") },
      { status: 502 },
    );
  }
}
