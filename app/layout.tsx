import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./../styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import AuthListener from "@/components/custom/auth-listener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personalized News Aggregator",
  description: "Your daily news, curated for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <AuthListener />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}