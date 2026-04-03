import { InfoTooltip } from "@/components/ui/tooltip";

const TERMS: Record<string, string> = {
  nettoRate:
    "Was du nach Steuerersparnis monatlich tatsächlich zahlst. Berechnet als Brutto-Rate minus Steuer- und SV-Ersparnis.",
  bruttoRate:
    "Die monatliche Leasingrate, die von deinem Bruttogehalt abgezogen wird. Basis für die Steuerersparnis.",
  entgeltumwandlung:
    "Dein Bruttogehalt wird um die Leasingrate reduziert. Dadurch fällst du in eine niedrigere Steuerstufe und zahlst weniger Sozialabgaben.",
  gwv: "Geldwerter Vorteil: Du versteuerst monatlich 0,25 % des Listenpreises (UVP) als geldwerten Vorteil — Dienstradversteuerung nach § 6 Abs. 1 Nr. 4 EStG.",
  uebernahmepreis:
    "Kaufpreis für das Fahrrad am Ende der Leasinglaufzeit. Typisch: 25 % (24 Mon.), 18 % (36 Mon.) oder 10 % (48 Mon.) des UVP.",
  gesamtersparnis:
    "Listenpreis minus Gesamtkosten (Netto-Raten × Laufzeit + Übernahmepreis). Zeigt, wieviel du gegenüber dem Direktkauf sparst.",
  bbg: "Beitragsbemessungsgrenze: Bis zu diesem Jahresbetrag werden Sozialversicherungsbeiträge berechnet. Einkommen darüber ist SV-frei.",
};

export function TermTooltip({ term }: { term: keyof typeof TERMS }) {
  return <InfoTooltip content={TERMS[term]} />;
}
