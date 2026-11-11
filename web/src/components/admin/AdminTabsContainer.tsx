"use client";
import {useT} from "@/i18n/useT";
import ActivityTypesContainer from "@/components/admin/ActivityTypesContainer";
import CompaniesContainer from "@/components/admin/CompaniesContainer";
import ContactRolesContainer from "@/components/admin/ContactRolesContainer";
import ContactsContainer from "@/components/admin/ContactsContainer";
import JobLocationsContainer from "@/components/admin/JobLocationsContainer";
import JobSourcesContainer from "@/components/admin/JobSourcesContainer";
import JobStagesContainer from "@/components/admin/JobStagesContainer";
import JobTitlesContainer from "@/components/admin/JobTitlesContainer";
import TagsContainer from "@/components/admin/TagsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

function AdminTabsContainer() {
  const tr = useT();

  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(queryParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [queryParams],
  );

  const onTabChange = (tab: string) => {
    router.push(pathname + "?" + createQueryString("tab", tab));
  };
  return (
    <Tabs
      defaultValue={queryParams.get("tab") || "companies"}
      onValueChange={(e) => onTabChange(e)}
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="companies">{tr("m4923413b40d7")}</TabsTrigger>
        <TabsTrigger value="job-titles">{tr("medf48f3ab798")}</TabsTrigger>
        <TabsTrigger value="locations">{tr("m95c61170318a")}</TabsTrigger>
        <TabsTrigger value="sources">{tr("mcaf85b0888d7")}</TabsTrigger>
        <TabsTrigger value="skills">{tr("m66d0f523a379")}</TabsTrigger>
        <TabsTrigger value="activity-types">{tr("mb8317d587987")}</TabsTrigger>
        <TabsTrigger value="contacts">{tr("mb450645debe2")}</TabsTrigger>
        <TabsTrigger value="roles">{tr("mc25337055464")}</TabsTrigger>
        <TabsTrigger value="stages">{tr("m3a17aa4e4abb")}</TabsTrigger>
      </TabsList>
      <TabsContent value="companies">
        <CompaniesContainer />
      </TabsContent>
      <TabsContent value="job-titles">
        <JobTitlesContainer />
      </TabsContent>
      <TabsContent value="locations">
        <JobLocationsContainer />
      </TabsContent>
      <TabsContent value="sources">
        <JobSourcesContainer />
      </TabsContent>
      <TabsContent value="skills">
        <TagsContainer />
      </TabsContent>
      <TabsContent value="activity-types">
        <ActivityTypesContainer />
      </TabsContent>
      <TabsContent value="contacts">
        <ContactsContainer />
      </TabsContent>
      <TabsContent value="roles">
        <ContactRolesContainer />
      </TabsContent>
      <TabsContent value="stages">
        <JobStagesContainer />
      </TabsContent>
    </Tabs>
  );
}

export default AdminTabsContainer;
