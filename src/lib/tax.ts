/**
 * German tax calculation module for JobRad bike leasing cost estimation.
 *
 * Implements:
 * - Einkommensteuer (§ 32a EStG, Grund- und Splittingtabelle)
 * - Solidaritätszuschlag (§ 3 SolZG)
 * - Kirchensteuer (Bundesland-abhängig)
 * - Sozialversicherung (KV, PV, RV, AV – Arbeitnehmeranteil)
 * - JobRad Netto-Rate aus Gehaltsumwandlung + Geldwertem Vorteil
 *
 * ⚠️  Tax constants are based on 2024 values.
 *     Verify at https://www.bundesfinanzministerium.de before each tax year.
 *
 * Note: This module does not subtract Werbungskostenpauschale or Sonderausgaben.
 * Numbers will therefore be slightly higher than actual tax, but the comparison
 * (before vs. after JobRad) is still accurate since both use the same basis.
 */

// ---------------------------------------------------------------------------
// Constants (update annually)
// ---------------------------------------------------------------------------

/**
 * Tax and social insurance constants for 2024 Germany.
 * Source: § 32a EStG 2024, SGB IV, BMF-Schreiben
 */
export const TAX_CONSTANTS_2024 = {
  year: 2024,

  // Income tax zones (§ 32a EStG 2024)
  grundfreibetrag: 11_604,
  zone2End: 17_005,
  zone3End: 66_760,
  zone4End: 277_825,

  // Zone 2: tax = (a × y + b) × y   where y = (zvE - grundfreibetrag) / 10_000
  zone2: { a: 979.18, b: 1_400 },
  // Zone 3: tax = (a × z + b) × z + c   where z = (zvE - zone2End) / 10_000
  zone3: { a: 192.59, b: 2_397, c: 966.53 },
  // Zone 4: tax = rate × zvE - offset
  zone4: { rate: 0.42, offset: 9_972.98 },
  // Zone 5 (Reichensteuer): tax = rate × zvE - offset
  zone5: { rate: 0.45, offset: 18_307.73 },

  // Solidaritätszuschlag (§ 3 SolZG 2024)
  soliFreibetrag: 18_130, // Freigrenze Einzelveranlagung
  soliRate: 0.055,
  soliMilderungsRate: 0.119, // Rate in der Milderungszone

  // Entlastungsbetrag für Alleinerziehende (SK 2)
  entlastungsbetragSK2: 4_260,

  // Social insurance (Arbeitnehmeranteil, 2024)
  sv: {
    kv: 0.073, // KV Allgemeiner Beitrag AN-Anteil
    kvZusatz: 0.0085, // KV durchschnittlicher Zusatzbeitrag AN-Anteil
    pv: 0.017, // PV AN-Anteil (mit Kindern)
    pvKinderlos: 0.006, // PV Kinderlosenzuschlag AN-Anteil
    rv: 0.093, // RV AN-Anteil
    av: 0.013, // AV AN-Anteil
  },

  // Beitragsbemessungsgrenzen (annual, 2024)
  bbg: {
    kvPv: 62_100, // KV + PV
    rvAv: 90_600, // RV + AV (West)
  },
} as const;

export type TaxConstants = typeof TAX_CONSTANTS_2024;
export const DEFAULT_TAX_CONSTANTS: TaxConstants = TAX_CONSTANTS_2024;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaxClass = 1 | 2 | 3 | 4 | 5 | 6;

/** ISO 3166-2:DE state codes */
export type GermanState =
  | "BB"
  | "BE"
  | "BW"
  | "BY"
  | "HB"
  | "HE"
  | "HH"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SH"
  | "SL"
  | "SN"
  | "ST"
  | "TH";

export interface TaxProfile {
  /** Brutto-Jahresgehalt in Euro */
  annualGrossSalary: number;
  /** Steuerklasse 1–6 */
  taxClass: TaxClass;
  /** Zahlt Kirchensteuer */
  churchTax: boolean;
  /** Bundesland (für Kirchensteuersatz; Default: 9 %) */
  state?: GermanState;
  /** Anzahl Kinder (für PV-Kinderlosenzuschlag; 0 = kinderlos) */
  childCount?: number;
}

export interface BikeLeaseParams {
  /** UVP / Listenpreis in Euro */
  listPrice: number;
  /** Monatliche Brutto-Leasingrate (wird vom Bruttolohn abgezogen) */
  monthlyGrossRate: number;
  /** Arbeitgeber-Zuschuss pro Monat in Euro */
  employerSubsidy?: number;
  /** Leasinglaufzeit in Monaten (für Gesamtkosten-Berechnung; Default: 36) */
  durationMonths?: number;
  /**
   * Übernahmepreis-Faktor als Anteil des UVP.
   * Default je Laufzeit: 24 Monate → 25 %, 36 → 18 %, 48 → 10 % (BDR-Empfehlung)
   */
  residualValueFactor?: number;
}

export interface AnnualTaxBreakdown {
  incomeTax: number;
  soli: number;
  churchTax: number;
  sv: number;
  totalDeductions: number;
  /** Netto-Jahreseinkommen (Bar-Auszahlung, ohne Sachbezüge) */
  netIncome: number;
}

export interface BikeLeaseResult {
  /** Monatliche Brutto-Leasingrate */
  monthlyGrossRate: number;
  /** Effektive monatliche Netto-Rate nach Steuer- und SV-Ersparnis */
  monthlyNetRate: number;
  /** Monatliche Gesamtersparnis (Steuer + SV) */
  monthlySaving: number;
  /** davon: monatliche Steuerersparnis (ESt + Soli + KiSt) */
  monthlyTaxSaving: number;
  /** davon: monatliche SV-Ersparnis */
  monthlySvSaving: number;
  /** Geldwerter Vorteil pro Monat (0,25 % des UVP) */
  monthlyBenefit: number;
  /** AG-Zuschuss pro Monat */
  monthlyEmployerSubsidy: number;
  /** Gesamtkosten über die Laufzeit inkl. Übernahmepreis */
  totalNetCost: number;
  /** Listenpreis (entspricht Direktkaufpreis) */
  directPurchasePrice: number;
  /** Gesamtersparnis gegenüber Direktkauf */
  totalSaving: number;
  /** Aufschlüsselung OHNE JobRad */
  taxBreakdownBefore: AnnualTaxBreakdown;
  /** Aufschlüsselung MIT JobRad */
  taxBreakdownAfter: AnnualTaxBreakdown;
}

// ---------------------------------------------------------------------------
// Core tax functions
// ---------------------------------------------------------------------------

/**
 * Einkommensteuer nach § 32a EStG Grundtabelle.
 * @param zvE - Zu versteuerndes Einkommen in Euro (ganzzahlig oder Dezimal)
 * @returns Einkommensteuer in Euro, abgerundet auf ganze Euro
 */
export function calculateIncomeTaxGrundtabelle(
  zvE: number,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): number {
  if (zvE <= 0) return 0;
  const c = constants;

  let tax: number;

  if (zvE <= c.grundfreibetrag) {
    tax = 0;
  } else if (zvE <= c.zone2End) {
    const y = (zvE - c.grundfreibetrag) / 10_000;
    tax = (c.zone2.a * y + c.zone2.b) * y;
  } else if (zvE <= c.zone3End) {
    const z = (zvE - c.zone2End) / 10_000;
    tax = (c.zone3.a * z + c.zone3.b) * z + c.zone3.c;
  } else if (zvE <= c.zone4End) {
    tax = c.zone4.rate * zvE - c.zone4.offset;
  } else {
    tax = c.zone5.rate * zvE - c.zone5.offset;
  }

  return Math.floor(Math.max(0, tax));
}

/**
 * Einkommensteuer je nach Steuerklasse:
 * - SK 3: Splittingtabelle (2 × Grundtabelle(zvE / 2))
 * - SK 2: Grundtabelle mit Entlastungsbetrag für Alleinerziehende
 * - SK 1, 4, 5, 6: Grundtabelle
 */
export function calculateIncomeTax(
  zvE: number,
  taxClass: TaxClass,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): number {
  if (zvE <= 0) return 0;

  switch (taxClass) {
    case 3:
      return 2 * calculateIncomeTaxGrundtabelle(zvE / 2, constants);
    case 2:
      return calculateIncomeTaxGrundtabelle(
        Math.max(0, zvE - constants.entlastungsbetragSK2),
        constants
      );
    default:
      return calculateIncomeTaxGrundtabelle(zvE, constants);
  }
}

/**
 * Solidaritätszuschlag (§ 3 SolZG).
 * Unter der Freigrenze: 0.
 * Milderungszone: linearer Anstieg von 0 auf 5,5 %.
 * Darüber: 5,5 % der Einkommensteuer.
 *
 * @returns Soli in Euro (auf 2 Dezimalstellen gerundet)
 */
export function calculateSoli(
  incomeTax: number,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): number {
  if (incomeTax <= constants.soliFreibetrag) return 0;

  // Ende der Milderungszone: 5,5% × ESt = milderungsRate × (ESt - Freigrenze)
  // → ESt × (milderungsRate - 5,5%) = milderungsRate × Freigrenze
  // → ESt_end = milderungsRate / (milderungsRate - soliRate) × Freigrenze
  const milderungsEnd =
    (constants.soliMilderungsRate / (constants.soliMilderungsRate - constants.soliRate)) *
    constants.soliFreibetrag;

  const soli =
    incomeTax <= milderungsEnd
      ? constants.soliMilderungsRate * (incomeTax - constants.soliFreibetrag)
      : constants.soliRate * incomeTax;

  return Math.round(soli * 100) / 100;
}

/**
 * Kirchensteuer.
 * Bayern (BY) und Baden-Württemberg (BW): 8 %
 * Alle anderen Bundesländer: 9 %
 *
 * @returns Kirchensteuer in Euro (auf 2 Dezimalstellen gerundet)
 */
export function calculateChurchTax(
  incomeTax: number,
  pays: boolean,
  state?: GermanState
): number {
  if (!pays) return 0;
  const rate = state === "BY" || state === "BW" ? 0.08 : 0.09;
  return Math.round(incomeTax * rate * 100) / 100;
}

/**
 * Jährlicher Arbeitnehmer-Anteil der Sozialversicherung (KV + PV + RV + AV).
 * Berechnung auf das tatsächliche Bruttogehalt, gedeckelt durch die BBG.
 *
 * @param annualGross - Brutto-Jahresgehalt (vor Gehaltsumwandlung, falls relevant)
 * @param hasChildren - false → Kinderlosenzuschlag PV gilt
 * @returns Jährlicher SV-Beitrag AN in Euro (auf 2 Dezimalstellen gerundet)
 */
export function calculateAnnualSV(
  annualGross: number,
  hasChildren: boolean,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): number {
  if (annualGross <= 0) return 0;
  const { sv, bbg } = constants;

  const kvBasis = Math.min(annualGross, bbg.kvPv);
  const kv = kvBasis * (sv.kv + sv.kvZusatz);
  const pv = kvBasis * (sv.pv + (hasChildren ? 0 : sv.pvKinderlos));

  const rvBasis = Math.min(annualGross, bbg.rvAv);
  const rv = rvBasis * sv.rv;
  const av = rvBasis * sv.av;

  return Math.round((kv + pv + rv + av) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Combined breakdown helper
// ---------------------------------------------------------------------------

function getAnnualBreakdown(
  annualGross: number,
  profile: TaxProfile,
  zvEOverride?: number,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): AnnualTaxBreakdown {
  const hasChildren = (profile.childCount ?? 0) > 0;
  const zvE = zvEOverride ?? annualGross;

  const incomeTax = calculateIncomeTax(zvE, profile.taxClass, constants);
  const soli = calculateSoli(incomeTax, constants);
  const churchTax = calculateChurchTax(incomeTax, profile.churchTax, profile.state);
  const sv = calculateAnnualSV(annualGross, hasChildren, constants);
  const totalDeductions = incomeTax + soli + churchTax + sv;

  return {
    incomeTax,
    soli,
    churchTax,
    sv,
    totalDeductions,
    netIncome: Math.round((annualGross - totalDeductions) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// JobRad helpers
// ---------------------------------------------------------------------------

/**
 * Geldwerter Vorteil für Dienstfahrrad: 0,25 % des UVP pro Monat (§ 6 Abs. 1 Nr. 4 EStG).
 */
export function calculateMonthlyBenefit(listPrice: number): number {
  return Math.round(listPrice * 0.0025 * 100) / 100;
}

/**
 * Schätzt die monatliche Brutto-Leasingrate aus dem UVP.
 * Typische Leasingfaktoren (variieren je Anbieter und Rahmenvertrag):
 * - 24 Monate: ~2,99 %/Monat
 * - 36 Monate: ~1,99 %/Monat
 * - 48 Monate: ~1,69 %/Monat
 */
export function estimateMonthlyGrossRate(
  listPrice: number,
  durationMonths: 24 | 36 | 48 = 36
): number {
  const factors: Record<number, number> = { 24: 0.0299, 36: 0.0199, 48: 0.0169 };
  return Math.round(listPrice * factors[durationMonths] * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Berechnet monatliche Netto-Rate und Gesamtersparnis für ein JobRad-Leasing.
 *
 * Algorithmus:
 * 1. Jährliche Steuer+SV OHNE JobRad auf Bruttolohn berechnen
 * 2. MIT JobRad:
 *    - Bruttolohn um Leasingrate reduzieren (Gehaltsumwandlung)
 *    - Geldwerten Vorteil (0,25 % UVP/Monat × 12) zum zvE addieren
 *    - SV wird auf das reduzierte Brutto berechnet (nicht auf GWV)
 * 3. Monatliche Netto-Rate = Bruttorate − monatliche Steuer-Ersparnis − SV-Ersparnis − AG-Zuschuss
 * 4. Gesamtkosten = Netto-Rate × Laufzeit + Übernahmepreis
 */
export function calculateBikeLease(
  profile: TaxProfile,
  params: BikeLeaseParams,
  constants: TaxConstants = DEFAULT_TAX_CONSTANTS
): BikeLeaseResult {
  const {
    listPrice,
    monthlyGrossRate,
    employerSubsidy = 0,
    durationMonths = 36,
    residualValueFactor,
  } = params;

  // Übernahmepreis-Faktor (BDR-Empfehlung nach Laufzeit)
  const defaultResidual = durationMonths <= 24 ? 0.25 : durationMonths <= 36 ? 0.18 : 0.1;
  const rvFactor = residualValueFactor ?? defaultResidual;

  const monthlyBenefit = calculateMonthlyBenefit(listPrice);
  const annualGrossRate = monthlyGrossRate * 12;
  const annualBenefit = monthlyBenefit * 12;

  // Reduziertes Brutto nach Gehaltsumwandlung (Basis für SV)
  const reducedGross = Math.max(0, profile.annualGrossSalary - annualGrossRate);
  // zvE mit Bike: reduziertes Brutto + GWV (GWV ist steuerpflichtig, aber nicht SV-pflichtig)
  const zvEWithBike = reducedGross + annualBenefit;

  // Aufschlüsselungen
  const before = getAnnualBreakdown(profile.annualGrossSalary, profile, undefined, constants);
  const after = getAnnualBreakdown(reducedGross, profile, zvEWithBike, constants);

  // Monatliche Ersparnisse
  const annualTaxSaving =
    before.incomeTax +
    before.soli +
    before.churchTax -
    (after.incomeTax + after.soli + after.churchTax);
  const annualSvSaving = before.sv - after.sv;

  const monthlyTaxSaving = Math.round((annualTaxSaving / 12) * 100) / 100;
  const monthlySvSaving = Math.round((annualSvSaving / 12) * 100) / 100;
  const monthlySaving = Math.round((monthlyTaxSaving + monthlySvSaving) * 100) / 100;

  const monthlyNetRate = Math.max(
    0,
    Math.round((monthlyGrossRate - monthlySaving - employerSubsidy) * 100) / 100
  );

  // Gesamtkosten über Laufzeit
  const residualValue = listPrice * rvFactor;
  const totalNetCost = Math.round((monthlyNetRate * durationMonths + residualValue) * 100) / 100;
  const totalSaving = Math.round((listPrice - totalNetCost) * 100) / 100;

  return {
    monthlyGrossRate,
    monthlyNetRate,
    monthlySaving,
    monthlyTaxSaving,
    monthlySvSaving,
    monthlyBenefit,
    monthlyEmployerSubsidy: employerSubsidy,
    totalNetCost,
    directPurchasePrice: listPrice,
    totalSaving,
    taxBreakdownBefore: before,
    taxBreakdownAfter: after,
  };
}
