import {message} from "@/i18n/message";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key-resolver";
import { log } from "@/lib/telemetry";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const apiKey = await resolveApiKey(userId, "gemini");

    if (!apiKey) {
      return NextResponse.json(
        { error: message("mf19f3bf96774") },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: message("m5bb1806471f5") },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error fetching models", {
      provider: "gemini",
      error: String(error),
    });
    return NextResponse.json(
      { error: message("m5bb1806471f5") },
      { status: 500 }
    );
  }
}
