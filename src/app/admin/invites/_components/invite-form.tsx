"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus } from "lucide-react";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
      setMessage({ type: "success", text: `Einladung an ${email} erstellt. G\u00fcltig f\u00fcr 7 Tage.` });
      setEmail("");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Fehler beim Einladen." });
    }

    setLoading(false);
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Neue Einladung</h3>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@beispiel.de"
          required
          className="max-w-sm"
        />
        <Button type="submit" disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          {loading ? "Wird erstellt..." : "Einladen"}
        </Button>
      </form>

      {message && (
        <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
