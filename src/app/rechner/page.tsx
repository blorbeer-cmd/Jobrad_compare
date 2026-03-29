"use client";

import { useTaxProfile } from "@/lib/use-tax-profile";
import { TaxProfileForm } from "@/components/tax/tax-profile-form";
import { BikeCalculator } from "@/components/tax/bike-calculator";
import { Skeleton } from "@/components/ui/skeleton";

export default function RechnerPage() {
  const { profile, saveProfile, clearProfile, loaded } = useTaxProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JobRad-Rechner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Berechne deine monatliche Netto-Leasingrate inkl. Gehaltsumwandlung,
          geldwertem Vorteil und optionalem Arbeitgeberzuschuss.
        </p>
      </div>

      {!loaded ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <TaxProfileForm
            initialProfile={profile}
            onSave={saveProfile}
            onClear={clearProfile}
          />
          <BikeCalculator profile={profile} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Alle Berechnungen sind Schätzungen auf Basis von § 32a EStG (2026) und
        den SV-Rechengrößen 2026. Maßgeblich sind die Angaben deines
        Arbeitgebers und deines Steuerberaters.
      </p>
    </div>
  );
}
