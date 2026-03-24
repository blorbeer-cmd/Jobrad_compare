"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage({ type: "success", text: `Einladung an ${email} gesendet.` });
      setEmail("");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage({
        type: "error",
        text: typeof data.error === "string" ? data.error : "Fehler beim Einladen.",
      });
    }

    setLoading(false);
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Neue Einladung</h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@beispiel.de"
          required
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Wird gesendet..." : "Einladen"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === "success"
              ? "text-green-600"
              : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
