"use client";
import {useT} from "@/i18n/useT";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "../ui/card";
import { ResponsiveCardHeader } from "../ResponsiveCardHeader";
import { APP_CONSTANTS } from "@/lib/constants";
import { JobSource } from "@/models/job.model";
import JobSourcesTable from "./JobSourcesTable";
import { getJobSourceList } from "@/actions/jobSource.actions";
import Loading from "../Loading";
import { Button } from "../ui/button";
import { RecordsCount } from "../RecordsCount";

function JobSourcesContainer() {
  const tr = useT();

  const [sources, setSources] = useState<JobSource[]>([]);
  const [totalJobSources, setTotalJobSources] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const loadJobSources = useCallback(
    async (page: number) => {
      setLoading(true);
      const { data, total } = await getJobSourceList(
        page,
        APP_CONSTANTS.RECORDS_PER_PAGE,
        "applied"
      );
      if (data) {
        setSources((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalJobSources(total);
        setPage(page);
        setLoading(false);
      }
    },
    []
  );

  const reloadJobSources = useCallback(async () => {
    await loadJobSources(1);
  }, [loadJobSources]);

  useEffect(() => {
    (async () => await loadJobSources(1))();
  }, [loadJobSources]);

  return (
    <>
      <div className="col-span-3">
        <Card x-chunk="dashboard-06-chunk-0">
          <ResponsiveCardHeader>
            <div className="flex items-baseline gap-2">
              <CardTitle>{tr("m4886b555faed")}</CardTitle>
              {!loading && totalJobSources > 0 && (
                <RecordsCount count={sources.length} total={totalJobSources} label={tr("m17789a916d72")} />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:ms-auto">
            </div>
          </ResponsiveCardHeader>
          <CardContent>
            {loading && <Loading />}
            {sources.length > 0 && (
              <>
                <JobSourcesTable
                  jobSources={sources}
                  reloadJobSources={reloadJobSources}
                />
              </>
            )}
            {sources.length < totalJobSources && (
              <div className="flex justify-center p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadJobSources(page + 1)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? tr("m47d2a515ef2f") : tr("m3f06cd334f48")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default JobSourcesContainer;
