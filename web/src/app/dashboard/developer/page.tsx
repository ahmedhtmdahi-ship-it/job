import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { Metadata } from "next";
import {
  MockActivitiesCard,
  MockProfileCard,
  MockJobsCard,
} from "@/components/developer/DeveloperContainer";
import { ClearAllDataButton } from "@/components/developer/ClearAllDataButton";
import { GenerateMockDataButton } from "@/components/developer/GenerateMockDataButton";

export const metadata: Metadata = {
  title: message("mcfd95b2a1fc7"),
  description: message("mdae0f7722d12"),
};

export default function DeveloperPage() {
  const tr = useT();

  return (
    <>
      <div className="col-span-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tr("md7de9cfa1296")}</h1>
          <p className="text-muted-foreground mt-2">
            {tr("mef3fd0cb8d4c")}</p>
        </div>
        <div className="flex gap-2">
          <GenerateMockDataButton />
          <ClearAllDataButton />
        </div>
      </div>
      <div className="col-start-1 self-start">
        <MockActivitiesCard />
      </div>
      <div className="col-start-2 self-start">
        <MockProfileCard />
      </div>
      <div className="col-start-3 self-start">
        <MockJobsCard />
      </div>
    </>
  );
}
