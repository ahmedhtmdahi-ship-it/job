"use client";
import {useT} from "@/i18n/useT";
import { Loader, Sparkles } from "lucide-react";
import type { AiModel } from "@/models/ai.model";
import { ResponsiveCardHeader } from "../../ResponsiveCardHeader";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

export function StructureWithAiCard({
  aiModel,
  ollamaConnected,
  connectionError,
  isStructuring,
  onStructure,
}: {
  aiModel: AiModel;
  ollamaConnected: boolean | null;
  connectionError: string;
  isStructuring: boolean;
  onStructure: () => void;
}) {
  const tr = useT();

  return (
    <Card className="border-dashed">
      <ResponsiveCardHeader>
        <div>
          <p className="text-sm text-muted-foreground">
            {tr("m155e9a6937ce")}</p>
          {aiModel.provider === "ollama" &&
            ollamaConnected === false &&
            connectionError && (
              <p className="text-xs text-red-600 mt-1">
                {connectionError}
              </p>
            )}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={
            isStructuring ||
            (aiModel.provider === "ollama" && ollamaConnected === false)
          }
          onClick={onStructure}
        >
          {isStructuring ? (
            <Loader className="h-4 w-4 animate-spin me-2" />
          ) : (
            <Sparkles className="h-4 w-4 me-2" />
          )}
          {isStructuring ? tr("m941a9dec9d73") : tr("m09894c7d176f")}
        </Button>
      </ResponsiveCardHeader>
    </Card>
  );
}
