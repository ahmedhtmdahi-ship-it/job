"use client";

import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, History, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toastError, toastSuccess } from "@/lib/toast";

interface PreflightResult {
  manifest: {
    formatVersion: number;
    appVersion: string;
    exportedAt: string;
    sourceEmail: string;
    counts: Record<string, number>;
  };
  emailMatches: boolean;
  targetIsEmpty: boolean;
  targetCounts: Record<string, number>;
}

interface SnapshotInfo {
  id: string;
  exportedAt: string;
  appVersion: string;
  counts: Record<string, number>;
  sizeBytes: number;
}

function CountGrid({ counts }: { counts: Record<string, number> }) {
  const tr = useT();

  const rows = Object.entries(counts).filter(([, n]) => n > 0);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{tr("m9cc3e24fe9d0")}</p>;
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
      {rows.map(([model, n]) => (
        <div key={model} className="flex justify-between gap-2">
          <span className="text-muted-foreground">{model}</span>
          <span className="font-medium tabular-nums">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default function DataSettings() {
  const tr = useT();

  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [restoring, setRestoring] = useState<SnapshotInfo | null>(null);

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/backup/snapshots");
      if (res.ok) setSnapshots((await res.json()) as SnapshotInfo[]);
    } catch {
      // A failed list is not worth a toast — the card just stays empty.
    }
  }, []);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  const runRollback = async () => {
    if (!restoring) return;
    const snapshotId = restoring.id;
    setRestoring(null);
    setBusy(true);
    try {
      const res = await fetch("/api/backup/rollback", {
        method: message("m9aee6b1bcdf6"),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error, tr("m69b0b69b890c"));
        return;
      }
      toastSuccess(
        tr("m9882c47d87a1"),
        tr("m475e8eafe881"),
      );
      await loadSnapshots();
    } catch {
      toastError(tr("m111ff6e1879b"), tr("m69b0b69b890c"));
    } finally {
      setBusy(false);
    }
  };

  const destroyed = preflight
    ? Object.entries(preflight.targetCounts).filter(([, n]) => n > 0)
    : [];

  const onSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPreflight(null);
    setSelected(file);
    if (!file) return;

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/backup/import/preflight", { method: message("m9aee6b1bcdf6"), body });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error, tr("mf7f9715fc63c"));
        return;
      }
      setPreflight(json as PreflightResult);
    } catch {
      toastError(tr("m111ff6e1879b"), tr("mf7f9715fc63c"));
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!selected) return;
    setConfirming(false);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", selected);
      body.append("confirmWipe", "true");
      const res = await fetch("/api/backup/import", { method: message("m9aee6b1bcdf6"), body });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error, tr("m0a26f41abd00"));
        return;
      }
      const total = Object.values(json.counts as Record<string, number>).reduce(
        (sum, n) => sum + n,
        0,
      );
      // Naming the snapshot is the whole point of taking one — a safety net
      // the user does not know exists is not a safety net.
      toastSuccess(
        `Restored ${total} rows and ${json.filesWritten} file(s).${
          json.snapshotPath
            ? " Your previous data was saved as a snapshot you can restore below."
            : ""
        } Re-enter your AI provider API keys, reissue MCP tokens, and reload the page.`,
        tr("ma9c747fe220f"),
      );
      setPreflight(null);
      setSelected(null);
      if (fileInput.current) fileInput.current.value = "";
      await loadSnapshots();
    } catch {
      toastError(tr("m111ff6e1879b"), tr("m0a26f41abd00"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{tr("m9c80b04be554")}</CardTitle>
          <CardDescription>
            {tr("md51efd90ed34")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tr("m49dc4ff58a0f")}<strong>{tr("m98f0d95dca67")}</strong>{tr("m9362c3d4d23e")}<strong> {tr("m6e3da9a2a9be")}</strong> {tr("m2e22b23aead7")}</p>
          <Button asChild>
            <a href="/api/backup/export" download>
              <Download className="me-2 h-4 w-4" />
              {tr("m669211280b63")}</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{tr("m4ccc73205558")}</CardTitle>
          <CardDescription>
            {tr("m9329b4827d6e")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-file">{tr("maf754deecdae")}</Label>
            <Input
              id="backup-file"
              ref={fileInput}
              type="file"
              accept=".zip,application/zip"
              onChange={onSelect}
              disabled={busy}
            />
          </div>

          {busy && !preflight && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tr("me72fbb36b74a")}</p>
          )}

          {preflight && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="text-sm">
                <p>
                  {tr("m391065e4dc23")}{" "}
                  {format(new Date(preflight.manifest.exportedAt), "PPp")} {tr("ma79f20055f79")}{preflight.manifest.appVersion}
                </p>
                <p className="text-muted-foreground">
                  {tr("m2ffa7659339d")}{preflight.manifest.sourceEmail}
                </p>
              </div>

              {!preflight.emailMatches && (
                <p className="rounded-sm bg-destructive/10 p-2 text-sm font-medium text-destructive">
                  {tr("m4308c4237a1d")}{preflight.manifest.sourceEmail}{tr("m47bb255d1f6f")}</p>
              )}

              <div>
                <p className="mb-1 text-sm font-medium">{tr("ma9c8314f15b6")}</p>
                <CountGrid counts={preflight.manifest.counts} />
              </div>

              <Button
                variant="destructive"
                onClick={() => setConfirming(true)}
                disabled={busy}
              >
                <Upload className="me-2 h-4 w-4" />
                {tr("m8add8fcf8762")}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">{tr("m8df062cbe979")}</CardTitle>
            <CardDescription>
              {tr("m76d7c36c67ea")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {format(new Date(snapshot.exportedAt), "PPp")}
                  </p>
                  <p className="text-muted-foreground">
                    {snapshot.counts.Job ?? 0} {tr("m746efc6de172")}{snapshot.counts.Resume ?? 0}{" "}
                    {tr("m6e696bebff0a")}{(snapshot.sizeBytes / 1024 / 1024).toFixed(1)} {tr("m1d09f6fa2323")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setRestoring(snapshot)}
                >
                  <History className="me-2 h-4 w-4" />
                  {tr("ma76e13b98392")}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={restoring !== null}
        onOpenChange={(open) => !open && setRestoring(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("me1b161efe007")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("mb1fad716517e")}{" "}
              {restoring && format(new Date(restoring.exportedAt), "PPp")}{tr("mfe6b8bbc0950")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction onClick={runRollback}>
              {tr("m931f703d1509")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("m789cf5bf7191")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {tr("mb7787a54d821")}</p>
                <ul className="list-inside list-disc text-sm">
                  {destroyed.map(([model, n]) => (
                    <li key={model}>
                      {n} {model.toLowerCase()}
                      {n === 1 ? "" : tr("m043a718774c5")}
                    </li>
                  ))}
                  {destroyed.length === 0 && <li>{tr("m3a93c17124b9")}</li>}
                </ul>
                {preflight && !preflight.emailMatches && (
                  <p className="font-medium text-destructive">
                    {tr("m6971f559d916")}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive-bg text-destructive-foreground hover:bg-destructive-bg/90"
              onClick={runImport}
            >
              {tr("m64f6668a0d18")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
