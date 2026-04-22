import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getConfig } from "@/lib/db";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  return {
    title: {
      default: config.site_name,
      template: `%s - ${config.site_name}`,
    },
    description: config.site_description,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth" className={GeistMono.variable}>
      <body className="antialiased font-mono">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" duration={1500} />
        </ThemeProvider>
      </body>
    </html>
  );
}
