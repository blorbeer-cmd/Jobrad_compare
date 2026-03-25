"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    AccessDenied: "Zugang verweigert. Du brauchst eine Einladung, um dich anzumelden.",
    Verification: "Der Magic Link ist abgelaufen. Bitte fordere einen neuen an.",
    Default: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>E-Mail gesendet</CardTitle>
          <CardDescription>
            Wir haben dir einen Magic Link an{" "}
            <span className="font-medium text-foreground">{email}</span>{" "}
            gesendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Klicke auf den Link in der E-Mail, um dich anzumelden.
            Prüfe auch deinen Spam-Ordner.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Gib deine E-Mail-Adresse ein, um einen Magic Link zu erhalten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessages[error] || errorMessages.Default}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              "Wird gesendet..."
            ) : (
              <>
                Magic Link senden
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense fallback={<div className="text-muted-foreground">Laden...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
