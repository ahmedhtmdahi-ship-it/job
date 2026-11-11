import {createTranslator} from "next-intl";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import {messageKeys, message as uiMessage} from "@/i18n/message";

const translators = {
  ar: createTranslator({locale: "ar", messages: ar.ui as Record<string, string>}),
  en: createTranslator({locale: "en", messages: en.ui as Record<string, string>}),
};
// Imperative toasts run outside React hooks; the document locale is set by the
// same request config as NextIntlClientProvider. No shared per-user locale state.
function localized(text: string) {
  const locale = typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
  const key = messageKeys[text];
  return key ? translators[locale].raw(key) : text;
}

import { toast } from "sonner";
import type { ActionResult } from "@/models/action.model";

export function toastSuccess(message: string, title?: string) {
  if (title) toast.success(localized(title), { description: localized(message) });
  else toast.success(localized(message));
}

export function toastError(message?: string, title?: string) {
  const text = message ?? uiMessage("m3ccd9d6586ef");
  if (title) toast.error(localized(title), { description: localized(text) });
  else toast.error(localized(text));
}

// For outcomes that are neither: a deliberate interruption is not an error.
export function toastInfo(message: string, title?: string) {
  if (title) toast.info(localized(title), { description: localized(message) });
  else toast.info(localized(message));
}

// Collapses the repeated success/error branch into one call.
export function toastActionResult<T>(
  result: ActionResult<T> | undefined,
  opts: { success: string; onSuccess?: (data: T | undefined) => void; error?: string },
) {
  if (result?.success) {
    toastSuccess(opts.success);
    opts.onSuccess?.(result.data);
  } else {
    toastError(result?.message ?? opts.error);
  }
}
