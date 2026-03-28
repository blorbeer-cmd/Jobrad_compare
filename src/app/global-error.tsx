"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error-boundary]", error);
  }, [error]);

  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Ein schwerwiegender Fehler ist aufgetreten
          </h2>
          <p style={{ marginTop: "0.5rem", color: "#666", maxWidth: "28rem" }}>
            Die Anwendung konnte nicht geladen werden. Bitte versuche es erneut.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#999" }}>
              Fehler-ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
