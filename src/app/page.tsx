import { requireAuth } from "@/lib/auth-guard";
import { BikeExplorer } from "./_components/bike-explorer";

export default async function Home() {
  await requireAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Fahrrad-Angebote vergleichen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Finde das beste JobRad-Angebot bei verschiedenen Händlern.
        </p>
      </div>
      <BikeExplorer />
    </div>
  );
}
