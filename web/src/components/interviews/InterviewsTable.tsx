"use client";
import {useT} from "@/i18n/useT";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import InterviewRow from "./InterviewRow";
import type { InterviewRow as InterviewRowType } from "@/models/interview.model";

type InterviewsTableProps = {
  interviews: InterviewRowType[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onEdit: (interview: InterviewRowType) => void;
  onChanged: () => void;
};

function InterviewsTable({
  interviews,
  expandedId,
  onToggle,
  onEdit,
  onChanged,
}: InterviewsTableProps) {
  const tr = useT();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">
            <span className="sr-only">{tr("m07548c2c6511")}</span>
          </TableHead>
          <TableHead>{tr("mcf9c7aa24a26")}</TableHead>
          <TableHead>{tr("mad617a0fdd57")}</TableHead>
          <TableHead>{tr("mcd9558acfc38")}</TableHead>
          <TableHead className="hidden md:table-cell">{tr("m2f343666aaa8")}</TableHead>
          <TableHead className="hidden lg:table-cell">{tr("m486b852f58ad")}</TableHead>
          <TableHead className="hidden sm:table-cell">{tr("m15675d39ef98")}</TableHead>
          <TableHead>{tr("m4e80abb5b146")}</TableHead>
          <TableHead>
            <span className="sr-only">{tr("mff8059dc6752")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interviews.map((interview) => (
          <InterviewRow
            key={interview.id}
            interview={interview}
            expanded={expandedId === interview.id}
            onToggle={() => onToggle(interview.id)}
            onEdit={() => onEdit(interview)}
            onOutcomeSaved={onChanged}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export default InterviewsTable;
