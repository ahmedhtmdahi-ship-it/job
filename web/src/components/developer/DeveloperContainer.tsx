"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  generateMockActivitiesAction,
  clearMockActivitiesAction,
  generateMockProfileDataAction,
  clearMockProfileDataAction,
  generateMockJobsAction,
  clearMockJobsAction,
} from "@/actions/mock.actions";

type StatusMessage = { type: "success" | "error"; text: string };

function StatusBanner({ message }: { message: StatusMessage }) {
  const tr = useT();

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        message.type === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-green-200 bg-green-50 text-green-900"
      }`}
    >
      {message.type === "error" ? (
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-semibold">
          {message.type === "error" ? tr("m54a0e8c17ebb") : tr("mc88a0b907419")}
        </p>
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}

export function MockActivitiesCard() {
  const tr = useT();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    const result = await generateMockActivitiesAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("m4dd7cd6ea6fb")
          : uiMessage("m5a9848b370d9")),
    });
    setIsGenerating(false);
  };

  const handleClear = async () => {
    if (
      !confirm(
        uiMessage("m4e729af3895f"),
      )
    )
      return;

    setIsClearing(true);
    setMessage(null);
    const result = await clearMockActivitiesAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("mad8237b83faf")
          : uiMessage("m3620c5665f3b")),
    });
    setIsClearing(false);
  };

  return (
    <div className="space-y-4">
      {message && <StatusBanner message={message} />}
      <Card>
        <CardHeader>
          <CardTitle>{tr("m79b3ca24a335")}</CardTitle>
          <CardDescription>
            {tr("m2f8c9e0def74")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{tr("mb2dd587d1b7f")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("m431801bd2210")}</p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isClearing}
              className="w-full"
            >
              {isGenerating && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {isGenerating ? tr("m49286f33b674") : tr("mb2dd587d1b7f")}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{tr("m37abe0de49e9")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("mc4fd4e615d5e")}</p>
            <Button
              onClick={handleClear}
              disabled={isClearing || isGenerating}
              variant="destructive"
              className="w-full"
            >
              {isClearing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isClearing ? tr("m07a82437cd44") : tr("m37abe0de49e9")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MockProfileCard() {
  const tr = useT();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    const result = await generateMockProfileDataAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("m88d319411429")
          : uiMessage("m921fd7ce4986")),
    });
    setIsGenerating(false);
  };

  const handleClear = async () => {
    if (
      !confirm(
        uiMessage("m7a1fa8b0c6b5"),
      )
    )
      return;

    setIsClearing(true);
    setMessage(null);
    const result = await clearMockProfileDataAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("m7f45aacc9f5f")
          : uiMessage("me05d226e20e8")),
    });
    setIsClearing(false);
  };

  return (
    <div className="space-y-4">
      {message && <StatusBanner message={message} />}
      <Card>
        <CardHeader>
          <CardTitle>{tr("m5acb49bc347c")}</CardTitle>
          <CardDescription>
            {tr("me2586a82767b")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{tr("m91ac357bdb2b")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("m887e32f84166")}{" "}<code>{tr("m9b9869301449")}</code> {" "}{tr("mbb240a5305ba")}</p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isClearing}
              className="w-full"
            >
              {isGenerating && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {isGenerating ? tr("m49286f33b674") : tr("m91ac357bdb2b")}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{tr("meb24b863358f")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("me3235df8a2c2")}{" "}<code>{tr("m9b9869301449")}</code>{tr("m3550ce7bee52")}</p>
            <Button
              onClick={handleClear}
              disabled={isClearing || isGenerating}
              variant="destructive"
              className="w-full"
            >
              {isClearing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isClearing ? tr("m07a82437cd44") : tr("meb24b863358f")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MockJobsCard() {
  const tr = useT();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    const result = await generateMockJobsAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("m980a894f3e53")
          : uiMessage("mad3fde30155a")),
    });
    setIsGenerating(false);
  };

  const handleClear = async () => {
    if (
      !confirm(
        uiMessage("m1e5ee73590e4"),
      )
    )
      return;

    setIsClearing(true);
    setMessage(null);
    const result = await clearMockJobsAction();
    setMessage({
      type: result.success ? "success" : "error",
      text:
        result.message ||
        (result.success
          ? uiMessage("m1d4191a90f70")
          : uiMessage("m2293ba504223")),
    });
    setIsClearing(false);
  };

  return (
    <div className="space-y-4">
      {message && <StatusBanner message={message} />}
      <Card>
        <CardHeader>
          <CardTitle>{tr("m961fa5332732")}</CardTitle>
          <CardDescription>
            {tr("m8829543af847")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{tr("m0cebf8651771")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("m8fdc9efa450f")}</p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isClearing}
              className="w-full"
            >
              {isGenerating && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {isGenerating ? tr("m49286f33b674") : tr("m0cebf8651771")}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{tr("mf9f132aeacca")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tr("m08b24bfdd3c9")}</p>
            <Button
              onClick={handleClear}
              disabled={isClearing || isGenerating}
              variant="destructive"
              className="w-full"
            >
              {isClearing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isClearing ? tr("m07a82437cd44") : tr("mf9f132aeacca")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
