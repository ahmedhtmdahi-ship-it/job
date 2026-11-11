import {useT} from "@/i18n/useT";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const tr = useT();

  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">{tr("me3ebaa16dd9d")}</h3>
      <p className="text-muted-foreground mt-2">
        {tr("m670d18c788f1")}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/dashboard">{tr("mb59e0c1cc1e1")}</Link>
      </Button>
    </div>
  );
}
