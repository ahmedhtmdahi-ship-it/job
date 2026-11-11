import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (typeof global.fetch === "undefined") {
  global.fetch = vi.fn();
}

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// Unit tests keep their existing English assertions. Browser tests exercise both real providers.
vi.mock("next-intl", async (importOriginal) => {
  const intl = await importOriginal<typeof import("next-intl")>();
  const messages = (await import("./messages/en.json")).default;
  const translators = {
    ui: intl.createTranslator({locale: "en", messages, namespace: "ui"}),
    locale: intl.createTranslator({locale: "en", messages, namespace: "locale"}),
    root: intl.createTranslator({locale: "en", messages}),
  };
  return {...intl, useLocale: () => "en", useTranslations: (namespace?: "ui" | "locale") => translators[namespace ?? "root"]};
});
vi.mock("@/actions/locale.actions", () => ({setLocale: vi.fn()}));
