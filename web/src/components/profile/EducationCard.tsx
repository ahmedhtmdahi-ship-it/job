"use client";
import {useDateFormat} from "@/i18n/useDateFormat";
import {useT} from "@/i18n/useT";
import { ResumeSection } from "@/models/profile.model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { TipTapContentViewer } from "../TipTapContentViewer";

interface EducationCardProps {
  educationSection: ResumeSection | undefined;
  openDialogForEdit: (id: string) => void;
}

function EducationCard({
  educationSection,
  openDialogForEdit,
}: EducationCardProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const { sectionTitle, educations } = educationSection!;
  return (
    <>
      <CardTitle className="ps-6 py-3">{sectionTitle}</CardTitle>
      {educations?.map(
        ({
          id,
          institution,
          degree,
          location: { label },
          fieldOfStudy,
          startDate,
          endDate,
          description,
        }) => (
          <Card key={id}>
            <CardHeader className="p-2 pb-0 flex-row justify-between relative">
              <CardTitle className="text-xl ps-4">{institution}</CardTitle>
              <Button
                title={tr("m464c4ffd019e")}
                variant="ghost"
                size="icon"
                className="h-8 w-8 absolute top-2 end-2"
                onClick={() => openDialogForEdit(id!)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">{tr("m464c4ffd019e")}</span>
              </Button>
            </CardHeader>
            <CardContent>
              <h3>
                {degree}, {fieldOfStudy}
              </h3>
              <CardDescription>
                {formatLocalized(startDate, "MMM yyyy")} -{" "}
                {endDate ? formatLocalized(endDate, "MMM yyyy") : tr("m43f9b89c0b9d")}
                <br />
                {label}
              </CardDescription>
              {description && (
                <div className="pt-2">
                  <TipTapContentViewer content={description} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}

export default EducationCard;
