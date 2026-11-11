import {getT} from "@/i18n/getT";
import {message as uiMessage} from "@/i18n/message";
import { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export async function generateMetadata() {
 const tr = await getT();
 return {
  title: tr("m47de23586e49"),
};
}

export default function Signup() {
  return <AuthCard mode="signup" />;
}
