"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  MoreVertical,
  Pencil,
  Tags,
  Trash,
  CirclePlay,
  Check,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Flame,
  AlignLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../StatusBadge";
import { TASK_STATUS_BADGE_COLORS } from "@/lib/badge-colors";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isThisWeek,
  parse,
} from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  Task,
  TASK_STATUSES,
  TaskGroupBy,
  TaskStatus,
} from "@/models/task.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { getDescriptionExcerpt, hasDescription } from "@/lib/tasks/description";

type TasksTableProps = {
  tasks: Task[];
  deleteTask: (id: string) => void;
  editTask: (id: string) => void;
  onChangeTaskStatus: (id: string, status: TaskStatus) => void;
  onStartActivity: (id: string) => void;
  groupBy?: TaskGroupBy;
};

type PriorityLevel = "low" | "medium" | "high" | "critical";

function getPriorityLevel(priority: number): PriorityLevel {
  if (priority <= 3) return "low";
  if (priority <= 6) return "medium";
  if (priority <= 8) return "high";
  return "critical";
}

const priorityConfig: Record<
  PriorityLevel,
  { icon: React.ElementType; color: string; label: string }
> = {
  low: {
    icon: ArrowDown,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    label: message("mf793de205ead"),
  },
  medium: {
    icon: ArrowRight,
    color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30",
    label: message("m8e588cd18774"),
  },
  high: {
    icon: ArrowUp,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    label: message("mc4ebc6d4a583"),
  },
  critical: {
    icon: Flame,
    color: "text-red-600 bg-red-100 dark:bg-red-900/30",
    label: message("m427dd2969bd1"),
  },
};

type DateGroup =
  | "Overdue"
  | "Today"
  | "Tomorrow"
  | "This Week"
  | "Later"
  | "No Due Date";

type CreatedDateGroup = string; // Format: "YYYY-MM-DD"
type UpdatedDateGroup = string; // Format: "YYYY-MM-DD"

function getDateGroup(dueDate: Date | null | undefined): DateGroup {
  if (!dueDate) return "No Due Date";
  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) return "Overdue";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return "This Week";
  return "Later";
}

function groupTasksByDate(tasks: Task[]): Record<DateGroup, Task[]> {
  const groups: Record<DateGroup, Task[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    "This Week": [],
    Later: [],
    "No Due Date": [],
  };

  tasks.forEach((task) => {
    const group = getDateGroup(task.dueDate);
    groups[group].push(task);
  });

  return groups;
}

function groupTasksByActivityType(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {};

  tasks.forEach((task) => {
    const key = task.activityType?.label || message("m737a61481e11");
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  return groups;
}

function groupTasksByCreatedDate(
  tasks: Task[],
): Record<CreatedDateGroup, Task[]> {
  const groups: Record<CreatedDateGroup, Task[]> = {};

  tasks.forEach((task) => {
    const dateStr = format(new Date(task.createdAt), "yyyy-MM-dd");
    const key = dateStr;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  return groups;
}

function groupTasksByUpdatedDate(
  tasks: Task[],
): Record<UpdatedDateGroup, Task[]> {
  const groups: Record<UpdatedDateGroup, Task[]> = {};

  tasks.forEach((task) => {
    const dateStr = format(new Date(task.updatedAt), "yyyy-MM-dd");
    const key = dateStr;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  return groups;
}

function TasksTable({
  tasks,
  deleteTask,
  editTask,
  onChangeTaskStatus,
  onStartActivity,
  groupBy = "none",
}: TasksTableProps) {
  const tr = useT();

  const [alertOpen, setAlertOpen] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState("");

  const onDeleteTask = (taskId: string) => {
    setAlertOpen(true);
    setTaskIdToDelete(taskId);
  };

  const renderTaskRow = (task: Task) => (
    <TableRow
      key={task.id}
      className={cn(
        "group relative h-9",
        task.status === "complete" && "opacity-60",
      )}
    >
      <TableCell className="w-[24px] py-1 ps-1 pe-1">
        <button
          onClick={() =>
            onChangeTaskStatus(
              task.id,
              task.status === "complete" ? "in-progress" : "complete",
            )
          }
          className={cn(
            "h-5 w-5 rounded-sm border flex items-center justify-center transition-colors",
            task.status === "complete"
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-gray-400",
          )}
          aria-label={
            task.status === "complete"
              ? tr("m66bc4d306378")
              : tr("m834a0609b7c8")
          }
        >
          {task.status === "complete" && <Check className="h-3 w-3" />}
        </button>
      </TableCell>
      <TableCell
        className={cn(
          "py-1 px-2 font-medium",
          task.status === "complete" && "line-through",
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <button
            onClick={() => editTask(task.id)}
            className="text-start hover:underline cursor-pointer"
            aria-label={tr("meab6cca5fe7d", {v0: task.title})}
          >
            {task.title}
          </button>
          {hasDescription(task.description) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlignLeft
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-label={tr("m07d0a435fbf8")}
                  data-testid="task-description-indicator"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                {getDescriptionExcerpt(task.description)}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </TableCell>
      <TableCell className="py-1 px-2">
        {task.activityType?.label || "—"}
      </TableCell>
      <TableCell className="hidden md:table-cell py-1 px-2">
        <StatusBadge
          label={TASK_STATUSES[task.status]}
          color={TASK_STATUS_BADGE_COLORS[task.status]}
          className="w-[110px] whitespace-nowrap justify-center"
        />
      </TableCell>
      <TableCell className="hidden md:table-cell py-1 px-2 text-center">
        {(() => {
          const level = getPriorityLevel(task.priority);
          const config = priorityConfig[level];
          const Icon = config.icon;
          return (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                config.color,
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{task.priority}</span>
            </div>
          );
        })()}
      </TableCell>
      <TableCell className="hidden md:table-cell py-1 px-2 text-center">
        {task.percentComplete}%
      </TableCell>
      <TableCell className="py-1 px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
              data-testid="task-actions-menu-btn"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{tr("mc02651240c87")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>{tr("mff8059dc6752")}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => editTask(task.id)}
              >
                <Pencil className="me-2 h-4 w-4" />
                {tr("mdda79d5a0e25")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="me-2 h-4 w-4" />
                  {tr("m9ea1f4a2bba5")}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="p-0">
                    {(Object.keys(TASK_STATUSES) as TaskStatus[]).map(
                      (status) => (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          key={status}
                          onSelect={() => onChangeTaskStatus(task.id, status)}
                          disabled={status === task.status}
                        >
                          <span>{TASK_STATUSES[status]}</span>
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-green-600"
                onClick={() => onStartActivity(task.id)}
              >
                <CirclePlay className="me-2 h-4 w-4" />
                {tr("m20209b27f575")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => onDeleteTask(task.id)}
              >
                <Trash className="me-2 h-4 w-4" />
                {tr("me2d0a54968ea")}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell className="hidden sm:table-cell py-1 px-1">
        <Button
          title={tr("m20209b27f575")}
          aria-haspopup="true"
          size="icon"
          variant="ghost"
          onClick={() => onStartActivity(task.id)}
          data-testid="task-start-activity-btn"
          className="opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300"
        >
          <span>
            <CirclePlay className="text-green-600" />
          </span>
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[24px] h-9 px-1">
          <span className="sr-only">{tr("m143b270a3260")}</span>
        </TableHead>
        <TableHead className="h-9 px-2">{tr("m7e8cd2056da7")}</TableHead>
        <TableHead className="h-9 px-2">{tr("me41076cafcdb")}</TableHead>
        <TableHead className="hidden md:table-cell h-9 px-2">{tr("m920e413c7d41")}</TableHead>
        <TableHead className="hidden md:table-cell h-9 px-2 text-center">
          {tr("md60dbba07922")}</TableHead>
        <TableHead className="hidden md:table-cell h-9 px-2 text-center">
          {tr("m4664827f8e89")}</TableHead>
        <TableHead className="h-9 px-1">
          <span className="sr-only">{tr("mff8059dc6752")}</span>
        </TableHead>
        <TableHead className="hidden sm:table-cell h-9 px-1">
          <span className="sr-only">{tr("m20209b27f575")}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderGroupedTables = (entries: [string, Task[]][]) => (
    <TooltipProvider delayDuration={300}>
      {entries.map(([label, groupTasks]) => (
        <div key={label} className="mb-6">
          <h3 className="text-sm font-semibold mb-2 px-2 py-1">
            {label} ({groupTasks.length})
          </h3>
          <Table>
            {renderTableHeader()}
            <TableBody>{groupTasks.map(renderTaskRow)}</TableBody>
          </Table>
        </div>
      ))}
      <DeleteAlertDialog
        pageTitle="task"
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onDelete={() => deleteTask(taskIdToDelete)}
      />
    </TooltipProvider>
  );

  const formatDateLabel = (dateStr: string) => {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return isToday(date) ? "Today" : format(date, "MMM d, yyyy");
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {tr("md956501b04dc")}</div>
    );
  }

  if (groupBy === "dueDate") {
    const groupedTasks = groupTasksByDate(tasks);
    const groupOrder: DateGroup[] = [
      "Overdue",
      "Today",
      "Tomorrow",
      "This Week",
      "Later",
      "No Due Date",
    ];

    return renderGroupedTables(
      groupOrder
        .filter((group) => groupedTasks[group].length > 0)
        .map((group) => [group, groupedTasks[group]]),
    );
  }

  if (groupBy === "activityType") {
    return renderGroupedTables(Object.entries(groupTasksByActivityType(tasks)));
  }

  if (groupBy === "createdDate" || groupBy === "updatedDate") {
    const groupedTasks =
      groupBy === "createdDate"
        ? groupTasksByCreatedDate(tasks)
        : groupTasksByUpdatedDate(tasks);

    return renderGroupedTables(
      Object.keys(groupedTasks)
        .sort()
        .reverse()
        .map((dateStr) => [formatDateLabel(dateStr), groupedTasks[dateStr]]),
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Table>
        {renderTableHeader()}
        <TableBody>{tasks.map(renderTaskRow)}</TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="task"
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onDelete={() => deleteTask(taskIdToDelete)}
      />
    </TooltipProvider>
  );
}

export default TasksTable;
