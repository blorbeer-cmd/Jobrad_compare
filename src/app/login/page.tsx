"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, CheckCircle, Zap } from "lucide-react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLoginEnabled, setDevLoginEnabled] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  useEffect(() => {
    fetch("/api/auth/dev-login-enabled")
      .then((r) => r.json())
      .then((d) => setDevLoginEnabled(d.enabled))
      .catch(() => {});
  }, []);

  const errorMessages: Record<string, string> = {
    AccessDenied: "Zugang verweigert. Du brauchst eine Einladung, um dich anzumelden.",
    Verification: "Der Magic Link ist abgelaufen. Bitte fordere einen neuen an.",
    CredentialsSignin: "Anmeldung fehlgeschlagen. Pruefe deine E-Mail-Adresse.",
    Default: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  };

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setSubmitted(true);
    setLoading(false);
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("dev-login", {
        email,
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.error) {
        setLoginError(`Login-Fehler: ${result.error}`);
        setLoading(false);
      } else {
        window.location.href = result?.url || "/";
      }
    } catch (err) {
      setLoginError(`Unerwarteter Fehler: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm shadow-card-hover border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xl">E-Mail gesendet</CardTitle>
            <CardDescription className="text-sm">
              Wir haben dir einen Magic Link an{" "}
              <span className="font-medium text-foreground">{email}</span>{" "}
              gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Klicke auf den Link in der E-Mail, um dich anzumelden.
              Pruefe auch deinen Spam-Ordner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-card-hover border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Anmelden</CardTitle>
          <CardDescription className="text-sm">
            {devLoginEnabled
              ? "Gib deine E-Mail-Adresse ein, um dich anzumelden."
              : "Gib deine E-Mail-Adresse ein, um einen Magic Link zu erhalten."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(error || loginError) && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
              {loginError || errorMessages[error!] || errorMessages.Default}
            </div>
          )}

          <form
            onSubmit={devLoginEnabled ? handleDevLogin : handleMagicLink}
            className="space-y-5"
          >
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail-Adresse
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
                className="mt-2 h-11"
              />
            </div>

            {devLoginEnabled ? (
              <Button type="submit" disabled={loading} className="w-full h-11 shadow-sm">
                {loading ? (
                  "Anmelden..."
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Direkt anmelden
                  </>
                )}
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="w-full h-11 shadow-sm">
                {loading ? (
                  "Wird gesendet..."
                ) : (
                  <>
                    Magic Link senden
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
