import {message as uiMessage} from "@/i18n/message";
import { JobResponse } from "@/models/job.model";
import { AiProvider } from "@/models/ai.model";
import { APP_CONSTANTS } from "@/lib/constants";

// Re-export for backwards compatibility
export { convertResumeToText } from "@/lib/ai/tools/preprocessing";
export { convertJobToText } from "@/lib/ai/tools/preprocessing-job";

export interface OllamaConnectionResult {
  isConnected: boolean;
  error?: string;
}

// Checks if the Ollama service is reachable
export const checkOllamaConnection = async (
  provider: AiProvider,
): Promise<OllamaConnectionResult> => {
  if (provider !== AiProvider.OLLAMA) {
    return { isConnected: true };
  }

  try {
    const response = await fetch("/api/ai/ollama/tags", {
      signal: AbortSignal.timeout(APP_CONSTANTS.AI_OLLAMA_LIST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        isConnected: false,
        error:
          uiMessage("m8d3ada01bbb2"),
      };
    }

    return { isConnected: true };
  } catch (error) {
    console.warn("Ollama connection check failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      isConnected: false,
      error: `Cannot connect to Ollama service. Please make sure Ollama is running. Error: ${errorMessage}`,
    };
  }
};
