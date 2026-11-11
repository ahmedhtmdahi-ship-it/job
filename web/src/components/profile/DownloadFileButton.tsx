import {useT} from "@/i18n/useT";
import { Paperclip } from "lucide-react";

export function DownloadFileButton(
  resumeId: string,
  filePath: any,
  fileTitle: string,
  fileName: string
) {
 const tr = useT();

  const handleDownload = async () => {
    const response = await fetch(
      `/api/profile/resume?resumeId=${encodeURIComponent(resumeId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Stored basename carries a timestamp and, after a restore, a file id
      link.download = fileName || filePath.split("/").pop();
      link.target = "_blank";
      link.click();
      window.URL.revokeObjectURL(url); // Clean up
    } else {
      console.error("Failed to download file");
    }
  };

  return (
    <button
      className="flex items-center"
      onClick={handleDownload}
      title={tr("mbf5c8f6eb860", {v0: fileName})}
    >
      <div>{fileTitle}</div>
      <Paperclip className="h-3.5 w-3.5 ms-1" />
    </button>
  );
}
