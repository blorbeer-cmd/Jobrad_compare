"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Etwas ist schiefgelaufen</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder lade die Seite neu.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground/60">
          Fehler-ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Erneut versuchen</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Seite neu laden
        </Button>
      </div>
    </div>
  );
}
