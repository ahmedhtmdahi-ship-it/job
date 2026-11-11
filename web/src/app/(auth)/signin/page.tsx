import {getT} from "@/i18n/getT";
import {message as uiMessage} from "@/i18n/message";
import { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export async function generateMetadata() {
 const tr = await getT();
 return {
  title: tr("mbcc0bcc9140b"),
};
}

export default function Signin() {
  return <AuthCard mode="signin" />;
}
