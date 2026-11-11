"use client";
import {useT} from "@/i18n/useT";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  SquareCheckBig,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AddContactShortcut from "./AddContactShortcut";

export default function JobsAppliedCard() {
  const tr = useT();

  const router = useRouter();
  return (
    <Card className="@lg:col-span-2 min-w-0 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-green-600">{tr("m67b696468610")}</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          {tr("m28fda9f43e5e")}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="justify-start min-w-0"
          onClick={() => router.push("/dashboard/myjobs?add-job=true")}
        >
          <BriefcaseBusiness className="h-3.5 w-3.5 me-1 shrink-0" />
          <span className="min-w-0 truncate">{tr("mfc2ab2389516")}</span>
        </Button>
        <Button
          variant="outline"
          className="justify-start min-w-0"
          onClick={() =>
            router.push("/dashboard/automations?add-automation=true")
          }
        >
          <Zap className="h-3.5 w-3.5 me-1 shrink-0" />
          <span className="min-w-0 truncate">{tr("m61c614f3e562")}</span>
        </Button>
        <Button
          variant="outline"
          className="justify-start min-w-0"
          onClick={() => router.push("/dashboard/tasks?add-task=true")}
        >
          <SquareCheckBig className="h-3.5 w-3.5 me-1 shrink-0" />
          <span className="min-w-0 truncate">{tr("m402df3f5878b")}</span>
        </Button>
        <Button
          variant="outline"
          className="justify-start min-w-0"
          onClick={() =>
            router.push("/dashboard/questions?add-question=true")
          }
        >
          <BookOpen className="h-3.5 w-3.5 me-1 shrink-0" />
          <span className="min-w-0 truncate">{tr("m1dc7ec5f8aed")}</span>
        </Button>
        <Button
          variant="outline"
          className="justify-start min-w-0"
          onClick={() =>
            router.push("/dashboard/activities?add-activity=true")
          }
        >
          <CalendarClock className="h-3.5 w-3.5 me-1 shrink-0" />
          <span className="min-w-0 truncate">{tr("m96c6e5ecd342")}</span>
        </Button>
        <AddContactShortcut />
      </CardFooter>
    </Card>
  );
}
