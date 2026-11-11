"use client";

import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { toastSuccess, toastError } from "@/lib/toast";
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
import { Loader2, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import {
  getUserApiKeys,
  saveApiKey,
  deleteApiKey,
  getDefaultOllamaBaseUrl,
} from "@/actions/apiKey.actions";
import type {
  ApiKeyClientResponse,
  ApiKeyProvider,
} from "@/models/apiKey.model";
import { getAiProviders } from "@/lib/ai/provider-registry";
import { AiProvider } from "@/models/ai.model";
import { checkOllamaConnection } from "@/utils/ai.utils";
import { getUserSettings } from "@/actions/userSettings.actions";

interface ProviderConfig {
  id: ApiKeyProvider;
  name: string;
  placeholder: string;
  inputType: "password" | "text";
  description: string;
  sensitive: boolean;
}

const PROVIDERS: ProviderConfig[] = getAiProviders().map((entry) => ({
  id: entry.id as ApiKeyProvider,
  name: entry.displayName,
  placeholder: entry.keyConfig.placeholder,
  inputType: entry.keyConfig.inputType,
  description: entry.keyConfig.description,
  sensitive: entry.keyConfig.sensitive,
}));

function ApiKeySettings() {
  const tr = useT();

  const [keys, setKeys] = useState<ApiKeyClientResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultOllamaUrl, setDefaultOllamaUrl] = useState(
    "http://127.0.0.1:11434",
  );
  const [editingProvider, setEditingProvider] = useState<ApiKeyProvider | null>(
    null,
  );
  const [inputValue, setInputValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
  const [ollamaChecking, setOllamaChecking] = useState(false);

  const recheckOllamaConnection = async () => {
    setOllamaChecking(true);
    const result = await checkOllamaConnection(AiProvider.OLLAMA);
    setOllamaConnected(result.isConnected);
    setOllamaChecking(false);
  };

  useEffect(() => {
    fetchKeys();
    getDefaultOllamaBaseUrl().then(setDefaultOllamaUrl);
    // Probing on mount for someone who picked another provider reads as the
    // app overriding their choice, so only auto-check when Ollama is selected.
    getUserSettings().then((result) => {
      if (result?.success && result.data?.settings?.ai?.provider === AiProvider.OLLAMA) {
        recheckOllamaConnection();
      }
    });
  }, []);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const result = await getUserApiKeys();
      if (result.success && result.data) {
        setKeys(result.data);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getKeyForProvider = (provider: ApiKeyProvider) =>
    keys.find((k) => k.provider === provider);

  const isBaseUrlProvider = (providerId: string) => {
    const entry = getAiProviders().find((e) => e.id === providerId);
    return entry?.credentialType === "base-url";
  };

  const handleVerifyAndSave = async (provider: ApiKeyProvider) => {
    if (!inputValue.trim()) return;

    setVerifying(true);
    try {
      const verifyRes = await fetch("/api/settings/api-keys/verify", {
        method: uiMessage("m9aee6b1bcdf6"),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: inputValue }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        const title =
          verifyData.reason === "unreachable"
            ? `Cannot reach ${PROVIDERS.find((p) => p.id === provider)?.name ?? provider}`
            : uiMessage("mf0f2383f8af8");
        toastError(tr(verifyData.error || uiMessage("m9d216344d134")), title);
        return;
      }

      const providerConfig = PROVIDERS.find((p) => p.id === provider);
      const saveResult = await saveApiKey({
        provider,
        key: inputValue,
        sensitive: providerConfig?.sensitive ?? true,
      });
      if (saveResult.success) {
        toastSuccess(tr("mdba59fb5cb0e", {v0: PROVIDERS.find((p) => p.id === provider)?.name}), tr("m934b6af41253"));
        setEditingProvider(null);
        setInputValue("");
        await fetchKeys();
      } else {
        toastError(tr(saveResult.message || uiMessage("me2446d6606fb")), tr("m53ad6f999b1f"));
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toastError(tr("m6615bf1c8fdd"));
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (provider: ApiKeyProvider) => {
    setDeleting(provider);
    try {
      const result = await deleteApiKey(provider);
      if (result.success) {
        toastSuccess(tr("m33200baa71a4", {v0: PROVIDERS.find((p) => p.id === provider)?.name}), tr("m2a2e2a1a3644"));
        await fetchKeys();
      } else {
        toastError(tr(result.message || uiMessage("mcb4de8d755c7")));
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setEditingProvider(null);
    setInputValue("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{tr("mc08f17eb9e11")}</h3>
          <p className="text-sm text-muted-foreground">
            {tr("m688d00440930")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{tr("me0c65255e48f")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{tr("mc08f17eb9e11")}</h3>
        <p className="text-sm text-muted-foreground">
          {tr("m2384e43527d7")}</p>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map((provider) => {
          const existingKey = getKeyForProvider(provider.id);
          const isEditing = editingProvider === provider.id;
          const isBaseUrl = isBaseUrlProvider(provider.id);

          return (
            <Card key={provider.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{tr(provider.name)}</CardTitle>
                    <CardDescription className="text-sm">
                      {tr(provider.description)}
                      {isBaseUrl && (
                        <span className="block text-xs text-muted-foreground/70 mt-0.5">
                          {tr("md1f6d9e71b8b")}{" "}{provider.id === "ollama" ? defaultOllamaUrl : provider.placeholder}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {existingKey ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900">
                      <CheckCircle className="h-3 w-3 me-1" />
                      {provider.sensitive
                        ? `····${existingKey.last4}`
                        : existingKey.displayValue || existingKey.last4}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{tr("mdd1841d29502")}</Badge>
                  )}
                </div>
              </CardHeader>
              {provider.id === "ollama" && (
                <div className="px-6 pb-3">
                  <div className="flex items-center gap-2">
                    {ollamaChecking ? (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{tr("m2e5f79bb94a8")}</span>
                      </div>
                    ) : ollamaConnected === true ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{tr("mafea168799b6")}</span>
                      </div>
                    ) : ollamaConnected === false ? (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{tr("m8e0fb3f1fe1e")}</span>
                      </div>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={recheckOllamaConnection}
                      disabled={ollamaChecking}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${ollamaChecking ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              )}
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`key-${provider.id}`}>
                        {isBaseUrl ? tr("m70589413a3c9") : tr("m23189d55f697")}
                      </Label>
                      <Input
                        id={`key-${provider.id}`}
                        type={provider.inputType}
                        placeholder={
                          isBaseUrl && provider.id === "ollama"
                            ? defaultOllamaUrl
                            : provider.placeholder
                        }
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerifyAndSave(provider.id)}
                        disabled={!inputValue.trim() || verifying}
                      >
                        {verifying && (
                          <Loader2 className="me-2 h-3 w-3 animate-spin" />
                        )}
                        {tr("m9ae81b244ddf")}</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        {tr("m19766ed6ccb2")}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingProvider(provider.id);
                        setInputValue("");
                      }}
                    >
                      <Plus className="h-3 w-3 me-1" />
                      {existingKey ? tr("m5cceb487e754") : tr("ma60fa666ef16")}
                    </Button>
                    {existingKey && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting === provider.id}
                          >
                            {deleting === provider.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            {isBaseUrl && (
                              <span className="ms-1">{tr("mbc5b45ae7b60")}</span>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {isBaseUrl
                                ? tr("m1e5e10192f05", {v0: provider.name})
                                : tr("m6f076f9e25c2")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {isBaseUrl ? (
                                <>
                                  {tr("m9a163eab87b8")}{" "}{tr(provider.name)} {" "}{tr("mfde41687c2ac")}{" "}
                                  {provider.id === "ollama"
                                    ? defaultOllamaUrl
                                    : provider.placeholder}
                                  .
                                </>
                              ) : (
                                <>
                                  {tr("mb6895971e24a")}{" "}
                                  {tr(provider.name)} {" "}{tr("m34231ea8dec9")}</>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(provider.id)}
                            >
                              {isBaseUrl ? tr("mdaee7606b339") : tr("me2d0a54968ea")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ApiKeySettings;
