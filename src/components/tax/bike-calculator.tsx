"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingDown, Info } from "lucide-react";
import { calculateBikeLease, estimateMonthlyGrossRate } from "@/lib/tax";
import type { TaxProfile } from "@/lib/tax";
import { DEFAULT_TAX_PROFILE } from "@/lib/use-tax-profile";
import { cn } from "@/lib/utils";
import { TermTooltip } from "./term-tooltip";

interface Props {
  profile: TaxProfile | null;
  initialListPrice?: number;
}

function formatEur(value: number, decimals = 2) {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const DURATION_OPTIONS = [
  { value: "24", label: "24 Monate" },
  { value: "36", label: "36 Monate" },
  { value: "48", label: "48 Monate" },
];

export function BikeCalculator({ profile, initialListPrice }: Props) {
  const [listPriceRaw, setListPriceRaw] = useState(initialListPrice ? String(initialListPrice) : "");
  const [duration, setDuration] = useState<24 | 36 | 48>(36);
  const [subsidy, setSubsidy] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const listPrice = parseFloat(listPriceRaw.replace(",", ".")) || 0;
  const employerSubsidy = parseFloat(subsidy.replace(",", ".")) || 0;
  const activeProfile = profile ?? DEFAULT_TAX_PROFILE;

  const result = useMemo(() => {
    if (listPrice < 100) return null;
    const monthlyGrossRate = estimateMonthlyGrossRate(listPrice, duration);
    return calculateBikeLease(activeProfile, {
      listPrice,
      monthlyGrossRate,
      employerSubsidy,
      durationMonths: duration,
    });
  }, [listPrice, duration, employerSubsidy, activeProfile]);

  const savingPercent = result
    ? Math.round((result.monthlySaving / result.monthlyGrossRate) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Fahrrad berechnen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="listprice">
              Listenpreis (UVP, €)
            </label>
            <Input
              id="listprice"
              type="number"
              min={100}
              max={20_000}
              step={50}
              value={listPriceRaw}
              onChange={(e) => setListPriceRaw(e.target.value)}
              placeholder="z.B. 3000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="duration">
              Leasinglaufzeit
            </label>
            <Select
              id="duration"
              value={String(duration)}
              onChange={(e) => setDuration(parseInt(e.target.value) as 24 | 36 | 48)}
              options={DURATION_OPTIONS}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="subsidy">
            Arbeitgeber-Zuschuss (€/Monat){" "}
            <span className="text-muted-foreground font-normal">– optional</span>
          </label>
          <Input
            id="subsidy"
            type="number"
            min={0}
            max={500}
            step={5}
            value={subsidy}
            onChange={(e) => setSubsidy(e.target.value)}
            placeholder="z.B. 20"
          />
        </div>

        {!profile && (
          <div className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Ergebnisse basieren auf Standardwerten (45.000 €, Klasse 1).
              Speichere dein Profil für genaue Netto-Raten.
            </span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 border-t pt-4">
            {/* Hero: Netto-Rate */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Monatliche Netto-Rate
                <TermTooltip term="nettoRate" />
                <span className="text-xs">(ohne Versicherung/Service)</span>
              </p>
              <p className="mt-1 text-4xl font-bold text-primary">
                {formatEur(result.monthlyNetRate)} €
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50 dark:bg-green-950">
                  <TrendingDown className="h-3 w-3" />
                  {savingPercent} % günstiger als Brutto-Rate
                </Badge>
              </div>
            </div>

            {/* Key figures */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Brutto-Rate / Monat <TermTooltip term="bruttoRate" />
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {formatEur(result.monthlyGrossRate)} €
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Ersparnis / Monat <TermTooltip term="entgeltumwandlung" />
                </p>
                <p className="mt-0.5 text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatEur(result.monthlySaving)} €
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Gesamtersparnis <TermTooltip term="gesamtersparnis" />
                </p>
                <p className="mt-0.5 text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatEur(result.totalSaving, 0)} €
                </p>
                <p className="text-xs text-muted-foreground">vs. Direktkauf ({formatEur(result.directPurchasePrice, 0)} €)</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Geldwerter Vorteil <TermTooltip term="gwv" />
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {formatEur(result.monthlyBenefit)} €
                </p>
                <p className="text-xs text-muted-foreground">/ Monat (0,25 % UVP)</p>
              </div>
            </div>

            {/* Employer subsidy */}
            {result.monthlyEmployerSubsidy > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900 p-3">
                <p className="text-xs text-muted-foreground">inkl. AG-Zuschuss</p>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  − {formatEur(result.monthlyEmployerSubsidy)} € / Monat vom Arbeitgeber
                </p>
              </div>
            )}

            {/* Detailed breakdown toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowBreakdown((v) => !v)}
            >
              {showBreakdown ? "Aufschlüsselung ausblenden" : "Detaillierte Aufschlüsselung anzeigen"}
            </Button>

            {showBreakdown && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Steuerliche Aufschlüsselung
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div />
                  <div className="text-center font-medium">ohne JobRad</div>
                  <div className="text-center font-medium text-primary">mit JobRad</div>

                  {([
                    ["Einkommensteuer", result.taxBreakdownBefore.incomeTax, result.taxBreakdownAfter.incomeTax],
                    ["Solidaritätszuschlag", result.taxBreakdownBefore.soli, result.taxBreakdownAfter.soli],
                    ["Kirchensteuer", result.taxBreakdownBefore.churchTax, result.taxBreakdownAfter.churchTax],
                    ["Sozialversicherung", result.taxBreakdownBefore.sv, result.taxBreakdownAfter.sv],
                  ] as [string, number, number][]).map(([label, before, after]) => (
                    <>
                      <div key={`${label}-l`} className="text-muted-foreground">{label}</div>
                      <div key={`${label}-b`} className="text-center tabular-nums">{formatEur(before, 0)} €</div>
                      <div key={`${label}-a`} className={cn("text-center tabular-nums", after < before && "text-green-600 dark:text-green-400")}>
                        {formatEur(after, 0)} €
                      </div>
                    </>
                  ))}

                  <div className="font-medium border-t pt-1">Netto-Einkommen</div>
                  <div className="text-center tabular-nums border-t pt-1 font-medium">
                    {formatEur(result.taxBreakdownBefore.netIncome, 0)} €
                  </div>
                  <div className="text-center tabular-nums border-t pt-1 font-medium">
                    {formatEur(result.taxBreakdownAfter.netIncome, 0)} €
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Brutto-Leasingrate {formatEur(result.monthlyGrossRate)} €/Monat · Geldwerter Vorteil {formatEur(result.monthlyBenefit)} €/Monat
                </p>
              </div>
            )}
          </div>
        )}

        {listPriceRaw && listPrice < 100 && (
          <p className="text-xs text-destructive">Mindestpreis: 100 €</p>
        )}
      </CardContent>
    </Card>
  );
}
