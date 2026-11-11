"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState } from "react";
import { PlusCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "../../ui/button";
import { CardTitle } from "../../ui/card";
import { ResponsiveCardHeader } from "../../ResponsiveCardHeader";
import { SearchInput } from "../../SearchInput";
import { RecordsCount } from "../../RecordsCount";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { TaskGroupBy, TaskStatus, TASK_STATUSES } from "@/models/task.model";

const GROUP_BY_OPTIONS: Record<TaskGroupBy, string> = {
  none: message("mdc937b598926"),
  createdDate: message("m95061d3a51cd"),
  dueDate: message("m57870fd03032"),
  updatedDate: message("m2352b34cc92c"),
  activityType: message("mf7b447cd9688"),
};

// Presentational: the Tasks card header — title/count, search, the combined
// status filter + group-by menu, and New Task.
export function TasksToolbar({
  tasksCount,
  totalTasks,
  initialLoading,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onToggleStatusFilter,
  groupBy,
  onGroupByChange,
  onAddTask,
}: {
  tasksCount: number;
  totalTasks: number;
  initialLoading: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: TaskStatus[];
  onToggleStatusFilter: (status: TaskStatus) => void;
  groupBy: TaskGroupBy;
  onGroupByChange: (value: string) => void;
  onAddTask: () => void;
}) {
  const tr = useT();

  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch with Radix UI components
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ResponsiveCardHeader>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <CardTitle>{tr("mb3a60e61a523")}</CardTitle>
        {!initialLoading && totalTasks > 0 && (
          <RecordsCount count={tasksCount} total={totalTasks} label={tr("m085154084c74")} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:ms-auto">
        <SearchInput
          value={searchTerm}
          onChange={onSearchTermChange}
          placeholder={tr("mc1af8370c5f6")}
        />
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={tr("m7b7fdf7fd61e")}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tr("me71a1a19361c")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(TASK_STATUSES) as TaskStatus[]).map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={() => onToggleStatusFilter(status)}
                >
                  {TASK_STATUSES[status]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{tr("m956a51f6b098")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={groupBy}
                onValueChange={onGroupByChange}
              >
                {(Object.keys(GROUP_BY_OPTIONS) as TaskGroupBy[]).map(
                  (value) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {GROUP_BY_OPTIONS[value]}
                    </DropdownMenuRadioItem>
                  ),
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={tr("m7b7fdf7fd61e")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={onAddTask}
          data-testid="add-task-btn"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("m718e58cc20d6")}</span>
        </Button>
      </div>
    </ResponsiveCardHeader>
  );
}
