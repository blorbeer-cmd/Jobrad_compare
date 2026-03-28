# JobRad Compare – Konsolidierte Roadmap

> Zusammenführung von User Stories, technischer Architektur und Produkt-Priorisierung.

---

## Übersicht

| Phase | Fokus | Stories | Status |
|-------|-------|---------|--------|
| **Phase 0** | Next.js-Projekt aufsetzen | – | Ausstehend |
| **Phase 1** | Profil & Einzelberechnung (MVP-Kern) | US-1.1, US-1.2 | Ausstehend |
| **Phase 2** | Berechnungslogik verfeinern | US-2.1, US-2.2 | Ausstehend |
| **Phase 3** | Mehrere Räder verwalten | US-3.1, US-3.2 | Ausstehend |
| **Phase 4** | Vergleich, Netto-Rate & Filter | US-4.1, US-4.2 | Ausstehend |
| **Phase 5** | Visualisierung & Export | US-5.1, US-5.2 | Ausstehend |
| **Phase 6** | Polish, Accessibility & Onboarding | US-6.1, US-6.2 | Ausstehend |

---

## Phase 0 – Next.js-Projekt aufsetzen

> Tech-Stack steht fest: **Next.js + TypeScript**. Diese Phase setzt das Fundament um.

### Technische Aufgaben

- [ ] **Next.js-Projekt initialisieren**: `create-next-app` mit TypeScript, App Router
- [ ] **Linting & Formatting**: ESLint, Prettier konfigurieren
- [ ] **Design-System Grundlagen**: Farbpalette, Typografie, Spacing (4px/8px), Design-Tokens als CSS-Variablen
- [ ] **CI/CD-Pipeline**: GitHub Actions für Lint, Type-Check, Tests, Build bei jedem Push
- [ ] **Deployment**: Vercel-Anbindung mit Preview-Deployments
- [ ] **Berechnungslogik-Modul**: Steuerberechnung als isoliertes, testbares Modul vorbereiten
- [ ] **Datenmodelle definieren**: TypeScript-Interfaces für Profil, Rad, Berechnung
- [ ] **localStorage-Abstraktion**: Speichern/Laden von Profil und Rädern

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Engineer | Next.js-Setup, Architektur, Datenmodelle |
| Designer | Design-System, Tokens, Farbpalette |
| DevOps | CI/CD, Deployment, Performance-Budgets |

### Definition of Done
- Next.js-Projekt baut erfolgreich, CI-Pipeline läuft, Preview-Deployment funktioniert
- Design-Tokens definiert, Basis-Layout steht

---

## Phase 1 – Profil & Einzelberechnung (MVP-Kern)

> **MoSCoW: Must Have** – Das Minimum, um einen Nutzen zu liefern.

### User Stories
- **US-1.1**: Persönliches Steuerprofil anlegen (Gehalt, Steuerklasse, Kirchensteuer, Bundesland)
- **US-1.2**: Einzelnes Rad berechnen (Listenpreis → Netto-Rate, Brutto-Rate, Ersparnis)

### Technische Aufgaben
- [ ] Profil-Formular mit Validierung (Eingabefelder, Fehlermeldungen)
- [ ] Steuerberechnung implementieren:
  - Einkommensteuer nach Grundtabelle
  - Solidaritätszuschlag (5,5%, Freigrenzen)
  - Kirchensteuer (8%/9% je Bundesland)
  - Sozialversicherung: KV, PV, RV, AV (AN-Anteil)
  - Beitragsbemessungsgrenzen
- [ ] Leasingrate-Berechnung: UVP × Leasingfaktor / Laufzeit
- [ ] Geldwerter Vorteil: 0,25% des UVP/Monat
- [ ] Netto-Rate-Berechnung: Differenz Netto mit/ohne Gehaltsumwandlung
- [ ] Ergebnis-Anzeige: Netto-Rate (prominent), Brutto-Rate, Ersparnis
- [ ] Profil in localStorage speichern, Datenschutz-Hinweis
- [ ] Unit Tests für alle Berechnungsformeln (gegen BMF-Tabellen validieren)

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Engineer | Formular, Berechnung, localStorage |
| Data Analyst | Steuerformeln validieren, Testdaten liefern |
| UX Writer | Labels, Fehlermeldungen, Datenschutz-Hinweis |
| Designer | Formular-Layout, Ergebnis-Darstellung |
| QA | Berechnungs-Tests, Edge Cases (Steuerklassen, Grenzen) |
| Accessibility | Formular-Labels, aria-required, Fokus-Management |

### Definition of Done
- Nutzer kann Profil anlegen und einen Listenpreis eingeben
- Korrekte Netto-Rate wird angezeigt
- Berechnung durch Unit Tests abgesichert (alle 6 Steuerklassen)

---

## Phase 2 – Berechnungslogik verfeinern

> **MoSCoW: Should Have** – Macht die Berechnung genauer und transparenter.

### User Stories
- **US-2.1**: Detaillierte Kostenaufstellung (Aufschlüsselung aller Posten)
- **US-2.2**: Arbeitgeber-Zuschuss berücksichtigen

### Technische Aufgaben
- [ ] Kostenaufschlüsselung: Leasingrate, Versicherung, Service, Übernahmepreis
- [ ] Vergleichsrechnung: JobRad vs. Direktkauf (Szenario A vs. B)
- [ ] Steuerersparnis aufschlüsseln (Einkommensteuer, Sozialabgaben, Kirchensteuer)
- [ ] AG-Zuschuss: Eingabefeld (€ oder %), Einrechnung in Netto-Rate
- [ ] Darstellung als Tabelle oder Balkendiagramm
- [ ] Konfigurierbare Konstanten für jährlich ändernde Werte (SV-Sätze, BBG)

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Data Analyst | Formeln erweitern, Restwert, Versicherung |
| Engineer | Aufschlüsselung-UI, AG-Zuschuss-Logik |
| UX Writer | Erklärungstexte für Kostenposten |
| Designer | Tabellen/Diagramm-Design |
| QA | Vergleichsrechnung testen, Randfälle |

### Definition of Done
- Alle Kostenposten transparent aufgeschlüsselt
- AG-Zuschuss fließt korrekt in Berechnung ein
- Vergleich Leasing vs. Direktkauf sichtbar

---

## Phase 3 – Mehrere Räder verwalten

> **MoSCoW: Should Have** – Kernfunktion des Vergleichsportals.

### User Stories
- **US-3.1**: Rad zur Merkliste hinzufügen (Name, Preis, Laufzeit)
- **US-3.2**: Schnelleingabe über URL/Link (Preis & Name automatisch auslesen)

### Technische Aufgaben
- [ ] Rad-Verwaltung: Hinzufügen, Bearbeiten, Löschen (localStorage)
- [ ] Karten/Listen-Ansicht für gespeicherte Räder
- [ ] URL-Parser: Produktname & Preis aus Shop-URLs extrahieren (Best Effort)
- [ ] Fallback bei fehlgeschlagenem URL-Parsing
- [ ] Mindestens 10 Räder speicherbar

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Engineer | CRUD-Logik, URL-Parser, localStorage |
| Designer | Karten-Layout, Interaktionen |
| UX Writer | Empty States, Fehlermeldungen beim URL-Import |
| QA | CRUD-Tests, URL-Parsing mit verschiedenen Shops |

### Definition of Done
- Nutzer kann mehrere Räder speichern und verwalten
- URL-Import funktioniert für mindestens 3 große Shops

---

## Phase 4 – Vergleich, Netto-Rate & Filter

> **MoSCoW: Should Have → Kern-Feature** – Die Netto-Rate als zentraler Vergleichswert.

### User Stories
- **US-4.1**: Räder vergleichen mit Netto-Rate & Filter (Sortierung, Min/Max-Slider)
- **US-4.2**: Beste Option hervorheben (Badges, Farbabstufung)

### Technische Aufgaben
- [ ] Vergleichstabelle: Alle Räder nebeneinander mit allen Kennzahlen
- [ ] **Netto-Rate prominent** anzeigen (größere Schrift, Akzentfarbe)
- [ ] Sortierung: nach Netto-Rate (Default), Listenpreis, Gesamtersparnis
- [ ] Filter: Min/Max-Slider für Netto-Rate und Listenpreis
- [ ] Aktive Filter anzeigen + "Filter zurücksetzen"
- [ ] Badges: "Niedrigste Netto-Rate", "Beste Ersparnis"
- [ ] Farbskala: grün (günstig) → rot (teuer)
- [ ] Live-Update bei Profiländerung
- [ ] Barrierefreie Tabelle: `<th>`, `scope`, `<caption>`, Keyboard-Sortierung

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Engineer | Vergleichslogik, Filter, Sortierung |
| Designer | Tabellen-Design, Badges, Farbskala, Slider |
| Accessibility | Tabellen-Semantik, Keyboard-Navigation, aria-live |
| UX Writer | Badge-Texte, Filter-Labels, Hinweis ohne Profil |
| QA | Sortierung/Filter testen, Responsiveness |

### Definition of Done
- Vergleichstabelle zeigt Netto-Rate als Hauptwert
- Sortierung und Filter funktionieren korrekt
- Badges markieren beste Optionen automatisch

---

## Phase 5 – Visualisierung & Export

> **MoSCoW: Could Have** – Mehrwert für Power-User und Sharing.

### User Stories
- **US-5.1**: Grafischer Vergleich (Balkendiagramme)
- **US-5.2**: Ergebnis exportieren / teilen (PDF, Share-Link)

### Technische Aufgaben
- [ ] Chart-Library integrieren (z.B. Chart.js, Recharts)
- [ ] Balkendiagramm: Netto-Rate pro Rad
- [ ] Balkendiagramm: Gesamtersparnis pro Rad
- [ ] Toggle: Tabelle ↔ Diagramm
- [ ] PDF-Export (Client-seitig, z.B. mit jsPDF/html2canvas)
- [ ] Teilen-Link: Daten als URL-Parameter oder Short-Link
- [ ] Druckoptimiertes CSS
- [ ] Charts mit Textalternativen (Accessibility)

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Engineer | Charts, PDF-Export, Share-Link |
| Designer | Chart-Styling, Drucklayout |
| Accessibility | Alt-Texte für Charts, Textalternativen |
| QA | Export-Tests, Cross-Browser |

### Definition of Done
- Diagramme zeigen korrekten Vergleich
- PDF enthält alle relevanten Daten
- Share-Link lädt gespeicherte Konfiguration

---

## Phase 6 – Polish, Accessibility & Onboarding

> **MoSCoW: Should Have (Accessibility) + Could Have (Onboarding)**

### User Stories
- **US-6.1**: Responsive Design & Accessibility (WCAG 2.1 AA)
- **US-6.2**: Onboarding & Hilfe (Tooltips, Wizard, FAQ)

### Technische Aufgaben
- [ ] Mobile-Layout: Cards statt Tabelle, Touch-Slider
- [ ] WCAG 2.1 AA Audit: Kontraste, Screenreader, Keyboard
- [ ] `prefers-reduced-motion` respektieren
- [ ] Touch-Targets ≥ 44x44px
- [ ] Tooltips für Fachbegriffe (Entgeltumwandlung, Leasingrate, Restwert)
- [ ] Optionaler Onboarding-Wizard (erster Besuch)
- [ ] FAQ-Bereich
- [ ] Lighthouse Audit: Performance > 90, Accessibility > 95

### Beteiligte Rollen
| Rolle | Aufgabe |
|-------|---------|
| Accessibility | Vollständiger WCAG-Audit, Screen-Reader-Tests |
| Designer | Mobile-Layout, Touch-Optimierung |
| UX Writer | Tooltip-Texte, FAQ-Inhalte, Wizard-Texte |
| Engineer | Responsive Implementierung, Wizard-Logik |
| DevOps | Lighthouse CI, Performance-Budgets durchsetzen |
| QA | Cross-Browser, Mobile-Testing, Accessibility-Tests |

### Definition of Done
- Lighthouse: Performance > 90, Accessibility > 95
- WCAG 2.1 AA vollständig erfüllt
- Onboarding-Wizard funktioniert, FAQ ist hilfreich

---

## Performance-Budgets (phasenübergreifend)

| Metrik | Ziel |
|--------|------|
| Lighthouse Performance | > 90 |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |
| Bundle Size (JS, gzipped) | < 150KB |

---

## Nächster Schritt

**→ Phase 0: Next.js-Projekt aufsetzen**

1. `create-next-app` mit TypeScript + App Router ausführen
2. ESLint & Prettier konfigurieren
3. Design-Tokens definieren (CSS-Variablen)
4. CI/CD-Pipeline aufsetzen (GitHub Actions)
5. TypeScript-Interfaces für Profil, Rad, Berechnung anlegen
6. Berechnungsmodul-Grundstruktur + erste Tests
