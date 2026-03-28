# JobRad Compare – User Stories & Sprint-Planung

## Personas

| Persona | Beschreibung |
|---------|-------------|
| **Markus (Vergleicher)** | Will mehrere Räder vergleichen und das beste Angebot finden |
| **Lisa (Erstnutzerin)** | Nutzt JobRad zum ersten Mal, braucht Orientierung |
| **Tom (Optimierer)** | Kennt JobRad bereits, will Steuerersparnis maximieren |

---

## Sprint 1 – Fundament: Profil & Einzelberechnung

### US-1.1: Persönliches Steuerprofil anlegen
> Als **Lisa (Erstnutzerin)** möchte ich mein Gehalt, meine Steuerklasse und Kirchensteuer-Info eingeben, damit ich eine personalisierte Berechnung bekomme.

**Acceptance Criteria:**
- [ ] Eingabefelder: Brutto-Jahresgehalt, Steuerklasse (1–6), Kirchensteuer (ja/nein), Bundesland
- [ ] Validierung aller Felder mit hilfreichen Fehlermeldungen
- [ ] Profil wird lokal gespeichert (localStorage) – kein Account nötig
- [ ] Hinweis auf Datenschutz: "Deine Daten bleiben auf deinem Gerät"

### US-1.2: Einzelnes Rad berechnen
> Als **Lisa** möchte ich den Listenpreis eines Rads eingeben und sofort sehen, was es mich netto pro Monat kostet.

**Acceptance Criteria:**
- [ ] Eingabefeld für Listenpreis (UVP)
- [ ] Auswahl Leasinglaufzeit (24/36/48 Monate)
- [ ] Anzeige: Monatliche Brutto-Rate, **Monatliche Netto-Rate** (prominent), Steuerersparnis pro Monat, Gesamtersparnis über Laufzeit
- [ ] Berechnung basiert auf gespeichertem Profil
- [ ] Ohne Profil: Standardwerte + Hinweis "Für genaue Berechnung Profil anlegen"

---

## Sprint 2 – Kern-Rechner verfeinern

### US-2.1: Detaillierte Kostenaufstellung
> Als **Tom (Optimierer)** möchte ich eine transparente Aufschlüsselung aller Kosten sehen, damit ich genau verstehe, wo meine Ersparnis herkommt.

**Acceptance Criteria:**
- [ ] Aufschlüsselung: Leasingrate, Versicherungsanteil, Servicepaket, Übernahmepreis (nach Leasing)
- [ ] Vergleich: "Was würdest du beim Direktkauf zahlen?" vs. "Was zahlst du über JobRad?"
- [ ] Steuerersparnis aufgeschlüsselt: Einkommensteuer, Sozialabgaben, ggf. Kirchensteuer
- [ ] Anzeige als übersichtliche Tabelle oder Balkendiagramm

### US-2.2: Arbeitgeber-Zuschuss berücksichtigen
> Als **Tom** möchte ich einen eventuellen Arbeitgeber-Zuschuss eingeben können, damit meine Berechnung noch genauer wird.

**Acceptance Criteria:**
- [ ] Optionales Eingabefeld: AG-Zuschuss (€ oder %)
- [ ] Zuschuss wird in Netto-Rate eingerechnet
- [ ] Info-Text: "Frag deinen Arbeitgeber, ob ein Zuschuss möglich ist"

---

## Sprint 3 – Mehrere Räder verwalten

### US-3.1: Rad zur Merkliste hinzufügen
> Als **Markus (Vergleicher)** möchte ich mehrere Räder mit Name und Preis speichern können, damit ich sie später vergleichen kann.

**Acceptance Criteria:**
- [ ] Button "Rad hinzufügen"
- [ ] Eingabe: Name/Label (optional), Listenpreis (Pflicht), Laufzeit
- [ ] Gespeicherte Räder erscheinen als Karten/Liste
- [ ] Löschen & Bearbeiten möglich
- [ ] Mindestens 10 Räder speicherbar

### US-3.2: Schnelleingabe über URL/Link
> Als **Markus** möchte ich einen Link zu einem Rad einfügen können, damit Preis und Name automatisch übernommen werden.

**Acceptance Criteria:**
- [ ] Eingabefeld für URL (z.B. von bike-discount.de, fahrrad-xxl.de)
- [ ] Automatisches Auslesen von Produktname und Preis (Best Effort)
- [ ] Fallback: Manuelle Eingabe, wenn Auslesen fehlschlägt
- [ ] Unterstützte Shops klar kommunizieren

---

## Sprint 4 – Vergleichstabelle & Netto-Rate

### US-4.1: Räder vergleichen mit Netto-Rate & Filter
> Als **Markus (Vergleicher)** möchte ich bei jedem Rad sofort die monatliche Netto-Rate sehen und die Tabelle danach filtern/sortieren können, damit ich schnell das beste Angebot finde.

**Acceptance Criteria:**

#### Anzeige pro Rad:
- [ ] Name/Label (optional)
- [ ] Listenpreis (UVP)
- [ ] **Monatliche Netto-Rate** (prominent, größere Schrift/Farbe)
- [ ] Monatliche Brutto-Rate
- [ ] Steuerersparnis (monatlich)
- [ ] Gesamtkosten über Laufzeit (inkl. Übernahme)
- [ ] Ersparnis vs. Direktkauf (€ und %)

#### Filter & Sortierung:
- [ ] **Sortierung nach Netto-Rate** (aufsteigend/absteigend) – Default: aufsteigend
- [ ] Sortierung nach Listenpreis
- [ ] Sortierung nach Gesamtersparnis
- [ ] **Preisfilter**: Min/Max-Slider für Netto-Rate (z.B. "Zeige nur Räder mit 30–80 €/Monat")
- [ ] **Preisfilter**: Min/Max-Slider für Listenpreis
- [ ] Aktive Filter sichtbar mit "Filter zurücksetzen"-Option

#### Berechnung:
- [ ] Netto-Rate berechnet sich automatisch aus Profildaten (Gehalt, Steuerklasse etc.)
- [ ] Ohne gespeichertes Profil: Hinweis "Profil anlegen für personalisierte Netto-Raten"
- [ ] Bei Profiländerung aktualisieren sich alle Netto-Raten live

### US-4.2: Beste Option hervorheben
> Als **Lisa** möchte ich auf einen Blick sehen, welches Rad das beste Preis-Leistungs-Verhältnis hat.

**Acceptance Criteria:**
- [ ] "Beste Ersparnis"-Badge am Rad mit höchster Gesamtersparnis
- [ ] "Niedrigste Netto-Rate"-Badge am günstigsten Rad
- [ ] Farbliche Abstufung (grün = günstig, rot = teuer)

---

## Sprint 5 – Visualisierung & Export

### US-5.1: Grafischer Vergleich
> Als **Markus** möchte ich die Netto-Raten und Ersparnisse als Diagramm sehen, damit der Vergleich sofort greifbar wird.

**Acceptance Criteria:**
- [ ] Balkendiagramm: Netto-Rate pro Rad (nebeneinander)
- [ ] Balkendiagramm: Gesamtersparnis pro Rad
- [ ] Toggle zwischen Tabellen- und Diagramm-Ansicht
- [ ] Responsive auf Mobile

### US-5.2: Ergebnis exportieren / teilen
> Als **Tom** möchte ich mein Vergleichsergebnis exportieren oder teilen können, damit ich es meinem Arbeitgeber oder Partner zeigen kann.

**Acceptance Criteria:**
- [ ] Export als PDF (Zusammenfassung mit allen Rädern)
- [ ] Teilen-Link generieren (Daten als URL-Parameter oder Short-Link)
- [ ] Druckoptimierte Ansicht

---

## Sprint 6 – Polish & Extras

### US-6.1: Responsive Design & Accessibility
> Als **Lisa** möchte ich das Tool auf dem Handy genauso gut nutzen können wie am Desktop.

**Acceptance Criteria:**
- [ ] Mobile-optimiertes Layout (Cards statt breiter Tabelle)
- [ ] Touch-freundliche Slider und Buttons
- [ ] WCAG 2.1 AA konform (Kontraste, Screenreader, Tastaturnavigation)

### US-6.2: Onboarding & Hilfe
> Als **Lisa (Erstnutzerin)** möchte ich kurze Erklärungen sehen, die mir helfen das Tool zu verstehen.

**Acceptance Criteria:**
- [ ] Tooltips bei Fachbegriffen (Entgeltumwandlung, Leasingrate, Übernahmepreis)
- [ ] Optionaler Schritt-für-Schritt-Wizard beim ersten Besuch
- [ ] FAQ-Bereich mit den häufigsten Fragen

---

## Priorisierung

| Prio | Sprint | Stories | Kern-Feature |
|------|--------|---------|-------------|
| 1 | Sprint 1 | US-1.1, US-1.2 | Profil & Einzelberechnung |
| 2 | Sprint 2 | US-2.1, US-2.2 | Detaillierte Kosten |
| 3 | Sprint 3 | US-3.1, US-3.2 | Mehrere Räder verwalten |
| 4 | Sprint 4 | US-4.1, US-4.2 | **Vergleich mit Netto-Rate & Filter** |
| 5 | Sprint 5 | US-5.1, US-5.2 | Visualisierung & Export |
| 6 | Sprint 6 | US-6.1, US-6.2 | Polish & Accessibility |
