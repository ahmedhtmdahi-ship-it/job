import {useT} from "@/i18n/useT";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BADGE_COLORS, BadgeColor } from "@/lib/badge-colors";

interface StatusBadgeProps {
  label: string;
  color: BadgeColor;
  className?: string;
  children?: ReactNode;
}

// Reusable colored badge; color values are centralized in @/lib/badge-colors
export function StatusBadge({
  label,
  color,
  className,
  children,
}: StatusBadgeProps) {
  const tr = useT();
  return (
    <Badge variant="outline" className={cn(BADGE_COLORS[color], className)}>
      {tr(label)}
      {children}
    </Badge>
  );
}
