"use client";
import {useRtlCalendar} from "./useRtlCalendar";
import {formatDate} from "@/i18n/formatting";
import {useDateFormat} from "@/i18n/useDateFormat";
import {useLocale} from "next-intl";
import {useT} from "@/i18n/useT";
import { useState } from "react";
import { ResponsiveCalendar } from "@nivo/calendar";
import { format, parseISO } from "date-fns";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export default function ActivityCalendar({
  years,
  dataByYear,
}: {
  years: string[];
  dataByYear: Record<string, any[]>;
}) {
  const formatLocalized = useDateFormat();

  const tr = useT();
  const locale = useLocale();
  const calendarRef = useRtlCalendar(locale === "ar");

  const { resolvedTheme } = useTheme();
  const [year, setYear] = useState(years.at(-1));
  const borderColor = resolvedTheme === "light" ? "#ffffff" : "#0e1117";
  const data = dataByYear[year ?? ""] ?? [];
  const hoursMap = Object.fromEntries(
    data.map((d) => [d.day, d.hours ?? 0]),
  );
  return (
    <Card className="w-[100%]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-green-600">{tr("ma055e426cfad")}</CardTitle>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]" aria-label={tr("md1bb04d36fe2")}>
              <SelectValue placeholder={tr("md1bb04d36fe2")} />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[200px]">
        <div ref={calendarRef} data-testid="activity-calendar-chart" dir="ltr" className={locale === "ar" ? "rtl-activity-calendar h-full" : "h-full"}>
        <ResponsiveCalendar
          monthLegend={(_year, month) => new Intl.DateTimeFormat(locale, {numberingSystem: "latn", month: "short"}).format(new Date(2020, month, 1))}
          data={data}
          from={`${year}-04-02`}
          to={`${year}-04-02`}
          emptyColor={resolvedTheme === "light" ? tr("m3d4e1c37ac49") : tr("m4eb3465a568d")}
          colors={["#90e0ef", "#48cae4", "#00b4d8", "#0096c7", "#0077b6"]}
          minValue={2}
          margin={{ top: 20, right: 0, bottom: 20, left: 0 }}
          yearSpacing={40}
          monthBorderColor={borderColor}
          dayBorderWidth={2}
          dayBorderColor={borderColor}
          tooltip={(day) => {
            const hours = hoursMap[day.day] ?? 0;
            return (
              <div
                style={{
                  background: "#1e293b",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <div><strong>{locale === "ar" ? formatDate(parseISO(day.day), locale, {weekday: "long", day: "numeric", month: "long", year: "numeric"}) : formatLocalized(parseISO(day.day), "EEE MMM d, yyyy")}</strong></div>
                <div>{day.value} {" "}{tr("m5e8c9902207a")}{Number(day.value) === 1 ? "" : tr("m043a718774c5")} {" "}{tr("mb4267ce93cbb")}</div>
                <div>{hours} {" "}{tr("m1b52f3a2e151")}{hours === 1 ? "" : tr("m043a718774c5")} {" "}{tr("m0651863bf5d9")}</div>
              </div>
            );
          }}
          theme={{
            text: {fontFamily: "inherit",
              fill: "#9ca3af",
            },
            tooltip: {
              container: {
                background: "#1e293b",
                color: "#fff",
              },
            },
          }}
          legends={[
            {
              anchor: "bottom-right",
              direction: "row",
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: "right-to-left",
            },
          ]}
        />
        </div>
      </CardContent>
    </Card>
  );
}
