"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Trash2, User } from "lucide-react";

export default function ProfilPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!session) {
    router.push("/login");
    return null;
  }

  async function handleExport() {
    window.location.href = "/api/account/export";
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/login" });
      }
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Mein Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kontoinformationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">E-Mail</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          {session.user.name && (
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datenschutz (DSGVO)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-medium">Meine Daten exportieren</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lade alle deine gespeicherten Daten (Profil, Favoriten, Notizen) als JSON-Datei herunter.
            </p>
            <Button variant="outline" className="mt-3 gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Daten exportieren
            </Button>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-medium text-destructive">Konto loeschen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Loescht dein Konto und alle damit verbundenen Daten unwiderruflich.
              Dies umfasst dein Profil, alle Favoriten und Notizen.
            </p>
            {deleteConfirm ? (
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Wird geloescht..." : "Ja, Konto endgueltig loeschen"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="mt-3 gap-2 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Konto loeschen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
