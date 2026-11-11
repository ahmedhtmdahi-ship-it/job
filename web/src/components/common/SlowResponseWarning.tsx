import {useT} from "@/i18n/useT";
import { Clock } from "lucide-react";

export const SlowResponseWarning = () => { const tr = useT(); return ((
  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800 animate-in fade-in duration-500">
    <Clock className="h-4 w-4 shrink-0" />
    <span>
      {tr("m8894b69c0f6a")}<span className="font-medium">{tr("m74a883a037bc")}</span> {tr("mb390932d2c3e")}</span>
  </div>
)); };
