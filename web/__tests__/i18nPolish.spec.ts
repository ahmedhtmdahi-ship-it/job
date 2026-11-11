import {describe, expect, it} from "vitest";
import {createTranslator} from "next-intl";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import {formatDate, formatNumber, numberLocale} from "@/i18n/formatting";
import {weeklyDateLabel} from "@/components/dashboard/chartFormatting";

const t = createTranslator({locale: "ar", messages: ar, namespace: "ui"});

describe("Arabic presentation polish", () => {
  it.each([[0, "لا توجد حقول مطلوبة متبقية:"], [1, "باقي حقل واحد مطلوب:"], [2, "باقي حقلان مطلوبان:"], [4, "باقي 4 حقول مطلوبة:"], [11, "باقي 11 حقلًا مطلوبًا:"], [102, "باقي 102 حقل مطلوب:"]])("pluralizes %i missing fields", (count, expected) => {
    expect(t("md50e40a2c113", {count})).toBe(expected);
  });

  it("keeps Latin digits in Arabic numbers, plurals, dates and third-party calendars", () => {
    expect(formatNumber(1230, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatNumber(-0, "ar")).toBe("0");
    expect(new Intl.NumberFormat(numberLocale("ar")).format(12)).toBe("12");
    expect(t("mb0e0db70e969", {count: 7})).toBe("بعد 7 أيام");
    expect(t("m5828ef1c1e95", {count: 0})).toBe("0 ساعة");
    expect(JSON.stringify(ar)).not.toMatch(/[٠-٩۰-۹]|[0-9](?:ساعة|يوم|أيام|دقيقة|وظائف)/);
  });

  it("formats chart dates in weekday/day/month order and handles a year boundary", () => {
    const reference = new Date(2026, 10, 11);
    expect(weeklyDateLabel("Thu, Nov 5", "ar", false, reference)).toBe("الخميس 5 نوفمبر");
    expect(weeklyDateLabel("Thu, Dec 31", "ar", false, new Date(2027, 0, 2))).toBe("الخميس 31 ديسمبر");
    expect(weeklyDateLabel("Thu, Nov 5", "en", false, reference)).toBe("Thu, Nov 5");
    expect(formatDate(new Date(2026,10,5), "ar", {weekday:"long",day:"numeric",month:"long"})).toBe("الخميس 5 نوفمبر");
  });

  it("uses the localized product name while preserving upstream credit", () => {
    expect(ar.ui.m00d43de3b952).toBe("أول شغلانة");
    expect(en.ui.m00d43de3b952).toBe("Awel Shoghlana");
    expect(en.ui.m8bb483f7be15).toBe("Based on JobSync (MIT)");
  });
});
