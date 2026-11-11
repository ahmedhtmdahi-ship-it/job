import {message} from "@/i18n/message";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key-resolver";
import { log } from "@/lib/telemetry";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const apiKey = await resolveApiKey(userId, "openai");

    if (!apiKey) {
      return NextResponse.json(
        { error: message("m22f1e4d696dd") },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: message("mb3e864c3e5a7") },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Error fetching models", {
      provider: "openai",
      error: String(error),
    });
    return NextResponse.json(
      { error: message("mb3e864c3e5a7") },
      { status: 500 }
    );
  }
}
