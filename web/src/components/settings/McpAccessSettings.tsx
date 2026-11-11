"use client";

import {useDateFormat} from "@/i18n/useDateFormat";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2, Plus, Trash2, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  createMcpToken,
  listMcpTokens,
  revokeMcpToken,
  type PublicTokenMeta,
} from "@/actions/mcpToken.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import { format } from "date-fns";

function CopyButton({ text }: { text: string }) {
  const tr = useT();

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError(tr("ma09b8cc378ef"), tr("m5b50e7a693fe"));
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeSnippet({ label, code }: { label: string; code: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="flex gap-2 items-start">
        <pre className="flex-1 bg-muted rounded-sm p-2 text-xs overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

function TokenRevealDialog({
  token,
  tokenName,
  mcpUrl,
  onClose,
}: {
  token: string;
  tokenName: string;
  mcpUrl: string;
  onClose: () => void;
}) {
  const tr = useT();

  const ocSnippet = JSON.stringify(
    {
      mcpServers: {
        jobsync: {
          type: "streamable-http",
          url: mcpUrl,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );

  const isInsecureNonLocalhost = (() => {
    try {
      const { protocol, hostname } = new URL(mcpUrl);
      return protocol === "http:" && hostname !== "localhost" && hostname !== "127.0.0.1";
    } catch {
      return false;
    }
  })();

  const claudeSnippet = `npx mcp-remote ${mcpUrl} --header "Authorization: Bearer ${token}"${
    isInsecureNonLocalhost ? " --allow-http" : ""
  }`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr("m266526e48c50")}</DialogTitle>
          <DialogDescription>
            {tr("mee1af8d76d51")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">{tr("mbb2d0a1768e9")}</Label>
            <div className="flex gap-2 items-center">
              <Input readOnly value={token} className="font-mono text-xs" />
              <CopyButton text={token} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{tr("me6f56fdfa57f")}</p>
            <CodeSnippet label={tr("m7828990eddda")} code={ocSnippet} />
            <CodeSnippet label={tr("me3e7330a61ac")} code={claudeSnippet} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{tr("m14ad567b6c5e")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function McpAccessSettings() {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const [tokens, setTokens] = useState<PublicTokenMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [expiryDays, setExpiryDays] = useState<30 | 90 | 365>(
    APP_CONSTANTS.MCP_TOKEN_EXPIRY_DEFAULT_DAYS as 30 | 90 | 365,
  );

  const [revealedToken, setRevealedToken] = useState<{ token: string; name: string } | null>(null);

  const mcpUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp`
      : "/api/mcp";

  const fetchTokens = async () => {
    setIsLoading(true);
    const result = await listMcpTokens();
    setTokens(result);
    setIsLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleGenerate = async () => {
    if (!tokenName.trim()) return;
    setGenerating(true);
    const result = await createMcpToken({ name: tokenName.trim(), expiryDays });
    setGenerating(false);
    if (!result.success) {
      toastError(result.message);
      return;
    }
    setRevealedToken({ token: result.token, name: result.record.name });
    setShowGenerateDialog(false);
    setTokenName("");
    setExpiryDays(APP_CONSTANTS.MCP_TOKEN_EXPIRY_DEFAULT_DAYS as 30 | 90 | 365);
    await fetchTokens();
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    const result = await revokeMcpToken(id);
    setRevoking(null);
    if (!result.success) {
      toastError(result.message ?? uiMessage("m804251d10e8a"));
      return;
    }
    setTokens((prev) => prev.filter((t) => t.id !== id));
    toastSuccess(tr("mcd7e9dbe5eec"));
  };

  return (
    <div className="space-y-6">
      {revealedToken && (
        <TokenRevealDialog
          token={revealedToken.token}
          tokenName={revealedToken.name}
          mcpUrl={mcpUrl}
          onClose={() => setRevealedToken(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{tr("m47e036731f32")}</CardTitle>
          <CardDescription>{tr("mc5eb641e2346")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{tr("m2578179d1779")}</Label>
            <div className="flex gap-2 items-center">
              <Input readOnly value={mcpUrl} className="font-mono text-sm" />
              <CopyButton text={mcpUrl} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg font-medium">{tr("m958113fa425c")}</CardTitle>
            <CardDescription>{tr("mb9790130fbe4")}</CardDescription>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setShowGenerateDialog(true)} disabled={isLoading}>
            <Plus className="h-4 w-4 me-1" />
            {tr("m49e49bb4401e")}</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> {" "}{tr("m168146c7d3c7")}</div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("m9f1eee7955e9")}</p>
          ) : (
            <div className="space-y-3">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-start justify-between border rounded-sm p-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.tokenPrefix}…</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{tr("md70b9e24bca2")}{" "}{formatLocalized(new Date(t.createdAt), "PP")}</span>
                      <span>{tr("mf6725f3af08a")}{" "}{formatLocalized(new Date(t.expiresAt), "PP")}</span>
                      {t.lastUsedAt && <span>{tr("m830ec7f812f9")}{" "}{formatLocalized(new Date(t.lastUsedAt), "PP")}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={revoking === t.id} title={tr("m14683b379324")}>
                        {revoking === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{tr("mfded37220623")}{t.name}{tr("m637ea677e843")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {tr("m0d3c326bc751")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevoke(t.id)}>{tr("m87e6d00bbf53")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("m5a0b84bc752f")}</DialogTitle>
            <DialogDescription>
              {tr("mc9eacbdb58ca")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{tr("m2e4186244bbd")}</Label>
              <Input
                placeholder={tr("mbbc3c604ed99")}
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <div className="space-y-2">
              <Label>{tr("mde9967524f05")}</Label>
              <Select
                value={String(expiryDays)}
                onValueChange={(v) => setExpiryDays(Number(v) as 30 | 90 | 365)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_CONSTANTS.MCP_TOKEN_EXPIRY_PRESETS.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} {" "}{tr("mab51004e9d71")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>{tr("m19766ed6ccb2")}</Button>
            <Button onClick={handleGenerate} disabled={generating || !tokenName.trim()}>
              {generating && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {tr("m49e49bb4401e")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
