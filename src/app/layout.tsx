import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { UserNav } from "@/components/auth/user-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobRad Vergleich",
  description: "Fahrrad-Angebote von JobRad-Partnern vergleichen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="container flex h-16 items-center justify-between">
                <h1 className="text-xl font-bold">JobRad Vergleich</h1>
                <UserNav />
              </div>
            </header>
            <main className="container flex-1 py-8">{children}</main>
            <footer className="border-t py-4">
              <div className="container text-sm text-muted-foreground">
                JobRad Fahrrad-Vergleichstool &middot; Internes Werkzeug
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
