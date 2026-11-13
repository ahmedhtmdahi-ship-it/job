import {message as uiMessage} from "@/i18n/message";
import {getT} from "@/i18n/getT";
import {LocaleDirection} from "@/components/LocaleDirection";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

const arabic = localFont({src: "./fonts/arabic/IBMPlexSansArabic-Regular.ttf", variable: "--font-arabic", weight: "400"});

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

export async function generateMetadata() {
 const tr = await getT();
 return {
  title: {
    template: `%s | ${tr("m00d43de3b952")}`,
    default: tr("m00d43de3b952"),
  },
  description: tr("m2c533e8b1339"),
};
}

interface Props {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: Readonly<Props>) {
  const tr = await getT();

  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          arabic.variable
        )}
      >
        <NextIntlClientProvider messages={messages}>
        <LocaleDirection>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        </LocaleDirection>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
