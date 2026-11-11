"use client";
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

interface ExperienceCardProps {
  experienceSection: ResumeSection | undefined;
  openDialogForEdit: (id: string) => void;
}

function ExperienceCard({
  experienceSection,
  openDialogForEdit,
}: ExperienceCardProps) {
  const tr = useT();

  return (
    <>
      <CardTitle className="ps-6 py-3">
        {experienceSection?.sectionTitle}
      </CardTitle>
      {experienceSection?.workExperiences?.map(
        ({
          id,
          jobTitle,
          Company,
          location,
          startDate,
          endDate,
          description,
        }) => (
          <Card key={id}>
            <CardHeader className="p-2 pb-0 flex-row justify-between relative">
              <CardTitle className="text-xl ps-4">{jobTitle.label}</CardTitle>
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
              <h3>{Company.label}</h3>
              <CardDescription>
                {format(startDate, "MMM yyyy")} -{" "}
                {endDate ? format(endDate, "MMM yyyy") : tr("m43f9b89c0b9d")}
                <br />
                {location.label}
              </CardDescription>
              <div className="pt-2">
                <TipTapContentViewer content={description} />
              </div>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}

export default ExperienceCard;
