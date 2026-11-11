import {message} from "@/i18n/message";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key-resolver";
import { log } from "@/lib/telemetry";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const apiKey = await resolveApiKey(userId, "openrouter");

    if (!apiKey) {
      return NextResponse.json(
        { error: message("med254ffb2618") },
        { status: 401 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: message("mb8c8da959b82") },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error fetching models", {
      provider: "openrouter",
      error: String(error),
    });
    return NextResponse.json(
      { error: message("mb8c8da959b82") },
      { status: 500 }
    );
  }
}
