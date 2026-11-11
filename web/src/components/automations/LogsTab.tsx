"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { AutomationLog, LogLevel } from "@/lib/automation-logger";

export interface LogData {
  logs: AutomationLog[];
  isRunning: boolean;
  startedAt?: string;
  completedAt?: string;
}

interface LogsTabProps {
  logData: LogData;
  onClearLogs: () => void;
}

export function LogsTab({ logData, onClearLogs }: LogsTabProps) {
  const tr = useT();

  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const filteredLogs =
    filter === "all"
      ? logData.logs
      : logData.logs.filter((log) => log.level === filter);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case "info":
        return "default" as const;
      case "success":
        return "default" as const;
      case "warning":
        return "secondary" as const;
      case "error":
        return "destructive" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{tr("m8b335a67256c")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                {tr("ma52ace420f21")}</Button>
              <Button
                size="sm"
                variant={filter === "info" ? "default" : "outline"}
                onClick={() => setFilter("info")}
              >
                {tr("m170322a32f3c")}</Button>
              <Button
                size="sm"
                variant={filter === "success" ? "default" : "outline"}
                onClick={() => setFilter("success")}
              >
                {tr("mc88a0b907419")}</Button>
              <Button
                size="sm"
                variant={filter === "warning" ? "default" : "outline"}
                onClick={() => setFilter("warning")}
              >
                {tr("me981ddae45d8")}</Button>
              <Button
                size="sm"
                variant={filter === "error" ? "default" : "outline"}
                onClick={() => setFilter("error")}
              >
                {tr("m54a0e8c17ebb")}</Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setClearConfirmOpen(true)}
              disabled={logData.logs.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {logData.startedAt && (
          <p className="text-sm text-muted-foreground">
            {tr("m8301e51f74b1")}{format(new Date(logData.startedAt), "MMM d, h:mm:ss a")}
            {logData.completedAt && (
              <>
                {" "}
                {tr("m5aa45ccab51a")}{" "}
                {format(new Date(logData.completedAt), "MMM d, h:mm:ss a")}
              </>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>
                {logData.logs.length === 0
                  ? tr("mdd0319f1f602")
                  : tr("m8610e03b73df")}
              </p>
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {[...filteredLogs].reverse().map((log, index) => (
                <div
                  key={index}
                  className="flex gap-2 p-2 rounded-sm border hover:bg-muted/50"
                >
                  <div className="shrink-0 pt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground">
                        {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                      </span>
                      <Badge
                        variant={getLevelBadgeVariant(log.level)}
                        className="text-xs"
                      >
                        {log.level}
                      </Badge>
                    </div>
                    <div className={getLevelColor(log.level)}>
                      {log.message}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("mff7b058c5b6c")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m1baeb44339fe")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(e) => {
                e.preventDefault();
                setClearConfirmOpen(false);
                onClearLogs();
              }}
            >
              {tr("md3a8a299660b")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
