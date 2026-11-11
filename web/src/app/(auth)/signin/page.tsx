import {message as uiMessage} from "@/i18n/message";
import { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: uiMessage("mbcc0bcc9140b"),
};

export default function Signin() {
  return <AuthCard mode="signin" />;
}
