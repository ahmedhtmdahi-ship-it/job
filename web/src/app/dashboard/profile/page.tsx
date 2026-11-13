import ProfileContainer from "@/components/profile/ProfileContainer";
import React from "react";
import Link from "next/link";
import {getTranslations} from "next-intl/server";

async function Profile() {
  const t = await getTranslations("opportunities");
  return (
    <div className="col-span-3">
      <Link className="mb-4 inline-block text-sm underline" href="/dashboard/opportunities#opportunity-preferences">{t("profile")}</Link>
      <ProfileContainer />
    </div>
  );
}

export default Profile;
