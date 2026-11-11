import {message as uiMessage} from "@/i18n/message";
import { auth } from "@/auth";
import { getOllamaBaseUrl } from "@/actions/apiKey.actions";
import { NextResponse } from "next/server";
import { APP_CONSTANTS } from "@/lib/constants";
import { log } from "@/lib/telemetry";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: uiMessage("md089c8a9fc28") }, { status: 401 });
    }

    const baseUrl = await getOllamaBaseUrl();
    const response = await fetch(`${baseUrl}/api/ps`, {
      signal: AbortSignal.timeout(APP_CONSTANTS.AI_OLLAMA_LIST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: uiMessage("m7aa4e30ffd52") },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error proxying Ollama ps", {
      provider: "ollama",
      error: String(error),
    });
    return NextResponse.json(
      { error: uiMessage("m738de92f5866") },
      { status: 502 },
    );
  }
}
