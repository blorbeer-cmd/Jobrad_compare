"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">Fehler im Admin-Bereich</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Beim Laden des Admin-Bereichs ist ein Fehler aufgetreten.
      </p>
      <Button className="mt-5" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}
