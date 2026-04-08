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
  viewportFit: "cover",
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
              <a href="#main-content" className="skip-link">
                Zum Hauptinhalt springen
              </a>

              <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 safe-top">
                <div className="container flex h-16 items-center gap-4 px-4 sm:px-6">
                  <Link
                    href="/"
                    className="group flex shrink-0 items-center gap-2.5 font-bold text-foreground transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm transition-transform group-hover:scale-105" aria-hidden="true">
                      <Bike className="h-[18px] w-[18px]" />
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-base font-bold tracking-tight">JobRad</span>
                      <span className="text-base font-bold tracking-tight text-primary"> Vergleich</span>
                    </div>
                  </Link>

                  <nav aria-label="Hauptnavigation" className="flex items-center gap-1 text-sm">
                    <Link href="/rechner" className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap">
                      Rechner
                    </Link>
                  </nav>

                  <div className="flex flex-1 items-center justify-end gap-2">
                    <ThemeToggle />
                    <UserNav />
                  </div>
                </div>
              </header>

              <main id="main-content" className="container flex-1 py-6 px-4 sm:px-6 sm:py-8">{children}</main>

              <footer className="border-t border-border/50 bg-muted/30">
                <div className="container flex items-center justify-between px-4 py-5 text-xs text-muted-foreground sm:px-6">
                  <span>JobRad Fahrrad-Vergleichstool &middot; Internes Werkzeug</span>
                  <nav aria-label="Footer">
                    <Link href="/datenschutz" className="hover:text-foreground transition-colors">
                      Datenschutz
                    </Link>
                  </nav>
                </div>
              </footer>
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
