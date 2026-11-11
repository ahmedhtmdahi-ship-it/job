import {message} from "@/i18n/message";
import { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: message("m47de23586e49"),
};

export default function Signup() {
  return <AuthCard mode="signup" />;
}
