import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { UserNav } from "@/components/auth/user-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bike } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JobRad Vergleich",
  description: "Fahrrad-Angebote von JobRad-Partnern vergleichen",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="container flex h-14 items-center gap-4">
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Bike className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline">JobRad Vergleich</span>
                    <span className="sm:hidden">JobRad</span>
                  </Link>

                  <nav className="flex items-center gap-4 text-sm">
                    <Link href="/rechner" className="text-muted-foreground hover:text-foreground transition-colors">
                      Rechner
                    </Link>
                  </nav>

                  <div className="flex flex-1 items-center justify-end gap-2">
                    <ThemeToggle />
                    <UserNav />
                  </div>
                </div>
              </header>

              <main className="container flex-1 py-6">{children}</main>

              <footer className="border-t bg-card">
                <div className="container flex items-center justify-between py-4 text-xs text-muted-foreground">
                  <span>JobRad Fahrrad-Vergleichstool &middot; Internes Werkzeug</span>
                  <Link href="/datenschutz" className="hover:text-foreground transition-colors">
                    Datenschutz
                  </Link>
                </div>
              </footer>
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
