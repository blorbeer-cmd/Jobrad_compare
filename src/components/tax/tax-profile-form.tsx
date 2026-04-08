"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Shield, CheckCircle2, Info, Trash2 } from "lucide-react";
import type { TaxProfile, GermanState } from "@/lib/tax";
import { DEFAULT_TAX_PROFILE } from "@/lib/use-tax-profile";
import { cn } from "@/lib/utils";

const STATE_OPTIONS: { value: string; label: string }[] = [
  { value: "BB", label: "Brandenburg" },
  { value: "BE", label: "Berlin" },
  { value: "BW", label: "Baden-Württemberg (8 % KiSt)" },
  { value: "BY", label: "Bayern (8 % KiSt)" },
  { value: "HB", label: "Bremen" },
  { value: "HE", label: "Hessen" },
  { value: "HH", label: "Hamburg" },
  { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" },
  { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" },
  { value: "SH", label: "Schleswig-Holstein" },
  { value: "SL", label: "Saarland" },
  { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" },
  { value: "TH", label: "Thüringen" },
];

const TAX_CLASS_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `Klasse ${n}`,
}));

const CHILDREN_OPTIONS = [0, 1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: n === 0 ? "Keine" : n === 5 ? "5 oder mehr" : String(n),
}));

interface Props {
  initialProfile: TaxProfile | null;
  onSave: (profile: TaxProfile) => void;
  onClear?: () => void;
}

export function TaxProfileForm({ initialProfile, onSave, onClear }: Props) {
  const base = initialProfile ?? DEFAULT_TAX_PROFILE;

  const [salary, setSalary] = useState(String(base.annualGrossSalary));
  const [taxClass, setTaxClass] = useState(String(base.taxClass));
  const [churchTax, setChurchTax] = useState(base.churchTax);
  const [state, setState] = useState<GermanState | "">(base.state ?? "");
  const [childCount, setChildCount] = useState(String(base.childCount ?? 0));
  const [saved, setSaved] = useState(!!initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): TaxProfile | null {
    const errs: Record<string, string> = {};

    const salaryNum = parseInt(salary.replace(/[.,\s]/g, ""), 10);
    if (!salaryNum || salaryNum < 1 || salaryNum > 1_000_000) {
      errs.salary = "Bitte ein Jahresgehalt zwischen 1 € und 1.000.000 € eingeben.";
    }

    const tcNum = parseInt(taxClass, 10) as 1 | 2 | 3 | 4 | 5 | 6;
    if (![1, 2, 3, 4, 5, 6].includes(tcNum)) {
      errs.taxClass = "Bitte eine gültige Steuerklasse wählen.";
    }

    const childNum = parseInt(childCount, 10);
    if (isNaN(childNum) || childNum < 0) {
      errs.childCount = "Ungültige Anzahl.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return null;

    return {
      annualGrossSalary: salaryNum,
      taxClass: tcNum,
      churchTax,
      state: state || undefined,
      childCount: childNum,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const profile = validate();
    if (!profile) return;
    onSave(profile);
    setSaved(true);
  }

  function handleClear() {
    setSaved(false);
    onClear?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Mein Steuerprofil
          {saved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Salary */}
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="salary">
              Brutto-Jahresgehalt (€){" "}
              <span className="font-normal text-muted-foreground">– pro Jahr, nicht pro Monat</span>
            </label>
            <Input
              id="salary"
              type="number"
              min={0}
              max={1_000_000}
              step={1}
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setSaved(false); }}
              placeholder="z.B. 45000"
              aria-invalid={!!errors.salary}
              aria-describedby={errors.salary ? "salary-error" : undefined}
              className={cn(errors.salary && "border-destructive")}
            />
            {errors.salary && (
              <p id="salary-error" className="text-xs text-destructive" role="alert">{errors.salary}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tax class */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="taxclass">
                Steuerklasse
              </label>
              <Select
                id="taxclass"
                value={taxClass}
                onChange={(e) => { setTaxClass(e.target.value); setSaved(false); }}
                options={TAX_CLASS_OPTIONS}
              />
            </div>

            {/* Children */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="children">
                Kinder
              </label>
              <Select
                id="children"
                value={childCount}
                onChange={(e) => { setChildCount(e.target.value); setSaved(false); }}
                options={CHILDREN_OPTIONS}
              />
              <p className="text-xs text-muted-foreground">für Pflegeversicherung</p>
            </div>
          </div>

          {/* Church tax */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Kirchensteuer</label>
            <div className="flex gap-2">
              {[
                { value: false, label: "Nein" },
                { value: true, label: "Ja" },
              ].map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={churchTax === value}
                  onClick={() => { setChurchTax(value); setSaved(false); }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                    churchTax === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* State (only relevant for church tax) */}
          {churchTax && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="state">
                Bundesland <span className="text-muted-foreground">(für Kirchensteuersatz)</span>
              </label>
              <Select
                id="state"
                value={state}
                onChange={(e) => { setState(e.target.value as GermanState); setSaved(false); }}
                options={STATE_OPTIONS}
                placeholder="Bundesland wählen…"
              />
            </div>
          )}

          {/* Privacy notice */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Deine Daten bleiben auf deinem Gerät — sie werden nicht an einen Server übermittelt.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" className="flex-1">
              {saved ? "Gespeichert ✓" : "Profil speichern"}
            </Button>
            {initialProfile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                title="Profil löschen"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </form>

        {!initialProfile && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Kein Profil gespeichert – die Berechnung verwendet Standardwerte
              (45.000 €, Klasse 1). Speichere dein Profil für genaue Ergebnisse.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
