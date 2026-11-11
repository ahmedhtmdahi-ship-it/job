"use client";
import {useT} from "@/i18n/useT";
import { Question } from "@/models/question.model";
import { QuestionCard } from "./QuestionCard";

type QuestionListProps = {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
};

export function QuestionList({ questions, onEdit, onDelete }: QuestionListProps) {
  const tr = useT();

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {tr("mda0730b11903")}</div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
