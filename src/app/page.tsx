import { requireAuth } from "@/lib/auth-guard";
import { BikeExplorer } from "./_components/bike-explorer";

export default async function Home() {
  await requireAuth();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          Fahrrad-Angebote <span className="text-gradient">vergleichen</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-lg">
          Finde das beste JobRad-Angebot bei verschiedenen Händlern.
        </p>
      </div>
      <BikeExplorer />
    </div>
  );
}
