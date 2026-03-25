import { requireAuth } from "@/lib/auth-guard";
import { BikeExplorer } from "./_components/bike-explorer";

export default async function Home() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Fahrrad-Angebote vergleichen
        </h2>
        <p className="text-muted-foreground">
          Finde das beste JobRad-Angebot bei verschiedenen Haendlern.
        </p>
      </div>
      <BikeExplorer />
    </div>
  );
}
