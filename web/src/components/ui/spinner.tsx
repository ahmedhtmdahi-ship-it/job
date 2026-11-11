import {useT} from "@/i18n/useT";
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const tr = useT();

  return (
    <Loader2Icon
      role="status"
      aria-label={tr("mdc380888c4e2")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
