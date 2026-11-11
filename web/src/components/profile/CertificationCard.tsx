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
import { Pencil, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface CertificationCardProps {
  certificationSection: ResumeSection | undefined;
  openDialogForEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function CertificationCard({
  certificationSection,
  openDialogForEdit,
  onDelete,
}: CertificationCardProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const { sectionTitle, licenseOrCertifications } = certificationSection!;
  return (
    <>
      <CardTitle className="ps-6 py-3">{sectionTitle}</CardTitle>
      {licenseOrCertifications?.map(
        ({
          id,
          title,
          organization,
          issueDate,
          expirationDate,
          credentialUrl,
        }) => (
          <Card key={id}>
            <CardHeader className="p-2 pb-0 flex-row justify-between relative">
              <CardTitle className="text-xl ps-4">{title}</CardTitle>
              <div className="flex gap-1 absolute top-2 end-2">
                <Button
                  title={tr("m464c4ffd019e")}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openDialogForEdit(id!)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">{tr("m464c4ffd019e")}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      title={tr("me2d0a54968ea")}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">{tr("me2d0a54968ea")}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{tr("m3e7b89218e2a")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {tr("m082157b319c3")}{title}{tr("m32c384643f76")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive-bg text-destructive-foreground hover:bg-destructive-bg/90"
                        onClick={() => onDelete(id!)}
                      >
                        {tr("me2d0a54968ea")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <h3>{organization}</h3>
              <CardDescription>
                {issueDate && (
                  <>{tr("m2b7dcdb1716b")}{" "}{formatLocalized(new Date(issueDate), "MMM yyyy")}</>
                )}
                {issueDate && expirationDate && " · "}
                {expirationDate ? (
                  <>{tr("m8353d67bd934")}{" "}{formatLocalized(new Date(expirationDate), "MMM yyyy")}</>
                ) : (
                  issueDate && " · No Expiration"
                )}
              </CardDescription>
              {credentialUrl && (
                <a
                  href={credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1"
                >
                  {tr("me49f6b423b0d")}<ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        ),
      )}
    </>
  );
}

export default CertificationCard;
