"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    AccessDenied:
      "Zugang verweigert. Du brauchst eine Einladung, um dich anzumelden.",
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
      <div className="w-full max-w-sm space-y-4 text-center">
        <h2 className="text-2xl font-bold">E-Mail gesendet</h2>
        <p className="text-muted-foreground">
          Wir haben dir einen Magic Link an{" "}
          <span className="font-medium text-foreground">{email}</span>{" "}
          gesendet. Klicke auf den Link in der E-Mail, um dich anzumelden.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Anmelden</h2>
        <p className="text-muted-foreground">
          Gib deine E-Mail-Adresse ein, um einen Magic Link zu erhalten.
        </p>
      </div>

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
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Wird gesendet..." : "Magic Link senden"}
        </button>
      </form>
    </div>
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
