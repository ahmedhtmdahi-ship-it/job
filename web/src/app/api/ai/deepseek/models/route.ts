import {message as uiMessage} from "@/i18n/message";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key-resolver";
import { log } from "@/lib/telemetry";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const apiKey = await resolveApiKey(userId, "deepseek");

    if (!apiKey) {
      return NextResponse.json(
        { error: uiMessage("m2df73551dc21") },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.deepseek.com/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: uiMessage("m8046fdc684db") },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error fetching models", {
      provider: "deepseek",
      error: String(error),
    });
    return NextResponse.json(
      { error: uiMessage("m8046fdc684db") },
      { status: 500 }
    );
  }
}
