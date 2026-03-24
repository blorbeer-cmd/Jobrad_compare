import { requireAuth } from "@/lib/auth-guard";

export default async function Home() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Fahrrad-Angebote vergleichen
        </h2>
        <p className="text-muted-foreground">
          Finde das beste JobRad-Angebot bei verschiedenen Händlern.
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>Noch keine Händler-Daten vorhanden.</p>
        <p className="text-sm mt-2">
          Händler-Adapter werden in Phase 4 implementiert.
        </p>
      </div>
    </div>
  );
}
