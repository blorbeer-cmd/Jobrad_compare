# Konzept: Flexible Produktvergleiche

## Vision

Das bestehende JobRad-Vergleichstool wird zu einer **generischen Vergleichsplattform** erweitert, die beliebige Produktkategorien unterstuetzt. Jede Produktkategorie definiert eigene **Vergleichskriterien** (Attribute), nach denen Nutzer filtern, sortieren und vergleichen koennen.

**Beispiele:**
- **Fahrraeder**: Kategorie, Preis, Marke, Haendler (Status quo)
- **Grafikkarten**: Speicher (VRAM), Hersteller, Chip-Modell, Taktfrequenz, TDP
- **Motherboards**: Sockel, Formfaktor, WLAN-6-faehig, RAM-Slots, Chipsatz
- **Monitore**: Aufloesung, Bildschirmgroesse, Panel-Typ, Bildwiederholrate

---

## Architektur-Konzept

### 1. Produktkategorie-Registry

Jede Produktkategorie wird als eigenstaendige Konfiguration definiert, die festlegt:

- **Name & Slug** (z.B. "Grafikkarten" / `grafikkarten`)
- **Icon** fuer die UI
- **Attribut-Definitionen** (die Vergleichskriterien)
- **Standard-Sortierung**
- **Zugehoerige Adapter** (Datenquellen/Haendler)

```typescript
// Konzept-Skizze: Produktkategorie-Definition
interface ProductCategory {
  slug: string;              // "grafikkarten"
  name: string;              // "Grafikkarten"
  icon: string;              // "gpu"
  attributes: AttributeDefinition[];
  defaultSort: { field: string; direction: 'asc' | 'desc' };
  adapters: string[];        // ["mindfactory", "alternate"]
}
```

### 2. Dynamische Attribut-Definitionen

Jedes Vergleichskriterium wird als **Attribut-Definition** beschrieben. Diese bestimmt, wie das Attribut angezeigt, gefiltert und verglichen wird.

```typescript
interface AttributeDefinition {
  key: string;               // "vram"
  label: string;             // "Videospeicher"
  type: 'number' | 'text' | 'boolean' | 'enum' | 'price';
  unit?: string;             // "GB", "MHz", "Zoll"
  filterable: boolean;       // Soll im Filter-Panel erscheinen?
  comparable: boolean;       // In Vergleichstabelle anzeigen?
  sortable: boolean;         // Kann danach sortiert werden?
  highlight?: 'min' | 'max'; // In Vergleichsansicht hervorheben (z.B. niedrigster Preis)
  enumValues?: string[];     // Bei type='enum': moegliche Werte
}
```

**Beispiel: Grafikkarten-Attribute**

| key | label | type | unit | filterable | highlight |
|-----|-------|------|------|------------|-----------|
| `price` | Preis | price | EUR | ja | min |
| `vram` | Videospeicher | number | GB | ja | max |
| `manufacturer` | Hersteller | enum | — | ja | — |
| `chipModel` | GPU-Chip | text | — | ja | — |
| `boostClock` | Boost-Takt | number | MHz | ja | max |
| `tdp` | TDP | number | W | nein | min |

**Beispiel: Motherboard-Attribute**

| key | label | type | unit | filterable | highlight |
|-----|-------|------|------|------------|-----------|
| `price` | Preis | price | EUR | ja | min |
| `socket` | Sockel | enum | — | ja | — |
| `formFactor` | Formfaktor | enum | — | ja | — |
| `wifi6` | WLAN 6 | boolean | — | ja | — |
| `ramSlots` | RAM-Slots | number | — | ja | max |
| `chipset` | Chipsatz | text | — | ja | — |

### 3. Generisches Produkt-Schema

Statt eines festen `BikeSchema` wird ein **generisches Produkt-Schema** verwendet:

```typescript
interface Product {
  id: string;
  categorySlug: string;       // Verweis auf Produktkategorie
  name: string;               // Produktname
  brand: string;              // Marke/Hersteller
  price: number;              // Preis (immer vorhanden)
  dealer: string;             // Haendler
  dealerUrl: string;          // Link zum Angebot
  imageUrl?: string;          // Produktbild
  availability?: string;      // Verfuegbarkeit
  attributes: Record<string, string | number | boolean>;  // Dynamische Attribute
}
```

Die `attributes`-Map enthaelt die kategoriespezifischen Werte:

```typescript
// Beispiel: Grafikkarte
{
  categorySlug: "grafikkarten",
  name: "MSI GeForce RTX 4070 Gaming X Trio",
  brand: "MSI",
  price: 599.90,
  dealer: "Mindfactory",
  attributes: {
    vram: 12,
    manufacturer: "NVIDIA",
    chipModel: "RTX 4070",
    boostClock: 2475,
    tdp: 200
  }
}
```

### 4. Generischer Adapter

Die bestehende Adapter-Architektur wird erweitert. Statt `BikeAdapter` gibt es einen `ProductAdapter`, der Produkte im generischen Format liefert:

```typescript
abstract class ProductAdapter {
  abstract categorySlug: string;
  abstract dealerName: string;
  abstract fetchProducts(): Promise<Product[]>;
}
```

Bestehende Bike-Adapter werden migriert und liefern Fahrraeder als `Product` mit `categorySlug: "fahrraeder"`.

### 5. Dynamische UI-Komponenten

Die UI-Komponenten (Filter-Sidebar, Vergleichstabelle, Produktkarten) werden **datengetrieben** anhand der Attribut-Definitionen gerendert:

- **Filter-Sidebar**: Generiert Filter-Widgets basierend auf `type` (Slider fuer `number`, Checkbox fuer `boolean`, Dropdown fuer `enum`)
- **Produktkarte**: Zeigt die wichtigsten Attribute (markiert als `comparable`) an
- **Vergleichstabelle**: Rendert Zeilen fuer jedes `comparable`-Attribut mit optionalem Highlighting

### 6. Datenbank-Erweiterung

```
ProductCategory
  - id, slug, name, icon, defaultSort, createdAt

AttributeDefinition
  - id, categoryId, key, label, type, unit,
    filterable, comparable, sortable, highlight, enumValues

Product (gecachte Produkte)
  - id, categorySlug, name, brand, price, dealer,
    dealerUrl, imageUrl, availability, attributes (JSON)

SavedProduct (ersetzt SavedBike)
  - id, userId, productId, categorySlug, productData (JSON),
    dealer, note, createdAt
```

---

## Migrationsstrategie

### Phase 0: Bike-Vergleichstool fertigstellen (Voraussetzung)

Bevor die Plattform generalisiert wird, muss das bestehende Fahrrad-Tool vollstaendig funktionsfaehig sein. Erst ein fertiges Produkt zeigt, welche Teile wirklich generisch sein muessen.

#### 0.1 Frontend an echte Daten anbinden
- `BikeExplorer` von hardcoded Demo-Daten auf `/api/bikes` API-Fetch umstellen
- Loading-States und Skeleton-Loader fuer das Bike-Grid
- Fehlerbehandlung bei fehlgeschlagenen API-Calls (Fehlermeldung in der UI)
- Scraper-Selektoren gegen echte Haendler-Websites testen und korrigieren

#### 0.2 Favoriten-Feature komplett implementieren
- API-Routen: `POST/GET /api/saved-bikes`, `DELETE/PATCH /api/saved-bikes/[id]`
- Herz-Button an API anbinden mit optimistischem UI-Update
- "Meine Favoriten"-Seite/Tab mit gespeicherten Raedern
- Notiz-Funktion auf gespeicherten Raedern (Erstellen, Bearbeiten, Loeschen)

#### 0.3 Testabdeckung aufbauen
- Unit-Tests fuer Adapter-Logik (Parsing, Normalisierung, Kategorie-Mapping)
- Unit-Tests fuer Filter- und Such-Logik
- API-Route-Tests (Auth-Guards, CRUD-Operationen, User-Scoping)
- Zod-Validierungs-Tests (gueltige und ungueltige Bike-Daten)

#### 0.4 DSGVO-Features umsetzen
- Konto-Loeschung mit Cascade Delete aller Nutzerdaten
- Daten-Export: Alle Favoriten und Notizen als JSON (Art. 20)
- Datenschutzerklaerung-Seite (erreichbar aus Footer und Registrierung)
- Einwilligungs-Hinweis bei der Registrierung

### Phase 1: Abstraktion (intern)
- Generisches `Product`-Interface einfuehren
- Bestehende Bike-Adapter auf `ProductAdapter` migrieren
- Fahrrad-Kategorie als erste `ProductCategory` konfigurieren
- `SavedBike` zu `SavedProduct` migrieren
- **Keine sichtbare Aenderung fuer Nutzer**

### Phase 2: Kategorie-Auswahl (UI)
- Kategorie-Switcher in der Navigation
- Dynamische Filter-Sidebar basierend auf Attribut-Definitionen
- Dynamische Vergleichstabelle
- URL-Struktur: `/kategorie/fahrraeder`, `/kategorie/grafikkarten`

### Phase 3: Weitere Produktkategorien
- Neue Adapter fuer Hardware-Haendler (z.B. Mindfactory, Alternate, Cyberport)
- Neue Kategorie-Konfigurationen (Grafikkarten, Motherboards, etc.)
- Eventuell: Admin-UI zum Anlegen neuer Kategorien und Attribute

### Phase 4: Erweiterte Features
- Kategorie-uebergreifende Suche
- Preishistorie pro Produkt
- Benachrichtigungen bei Preisaenderungen
- Oeffentliche Vergleichslisten (teilen per Link)

---

## User Stories

### Epic 0: Bike-Vergleichstool fertigstellen

**US-0.1: Echte Daten im Frontend anzeigen**
> Als Nutzer moechte ich echte Fahrrad-Angebote von verschiedenen Haendlern sehen,
> damit ich tatsaechliche Preise vergleichen kann statt Demo-Daten.

**Akzeptanzkriterien:**
- BikeExplorer ruft `/api/bikes` auf statt hardcoded Demo-Daten zu verwenden
- Waehrend des Ladens wird ein Skeleton-/Loading-State angezeigt
- Bei Fehler wird eine verstaendliche Meldung auf Deutsch angezeigt
- Filter und Suche funktionieren mit den echten Daten

---

**US-0.2: Scraper-Selektoren validieren**
> Als Entwickler moechte ich sicherstellen, dass die Adapter echte Daten von den Haendler-Websites extrahieren,
> damit das Tool zuverlaessig aktuelle Angebote anzeigt.

**Akzeptanzkriterien:**
- Jeder Adapter (FahrradXXL, BikeDiscount, LuckyBike) liefert mindestens 1 Ergebnis von der echten Website
- Selektoren sind an die aktuelle DOM-Struktur der Haendler-Seiten angepasst
- Bei fehlgeschlagenem Scraping wird ein Fehler geloggt und der Adapter uebersprungen
- Unit-Tests pruefen das Parsing mit gespeicherten HTML-Snippets

---

**US-0.3: Fahrrad speichern (Favorit)**
> Als angemeldeter Nutzer moechte ich ein Fahrrad als Favorit speichern koennen,
> damit ich es spaeter wiederfinde, ohne erneut suchen zu muessen.

**Akzeptanzkriterien:**
- Klick auf Herz-Icon speichert das Fahrrad in der Datenbank (`SavedBike`)
- Optimistisches UI-Update: Herz wird sofort gefuellt, API-Call im Hintergrund
- Erneuter Klick entfernt den Favoriten (Toggle)
- Gespeicherte Favoriten bleiben ueber Sessions hinweg erhalten

---

**US-0.4: Gespeicherte Fahrraeder anzeigen**
> Als angemeldeter Nutzer moechte ich eine Uebersicht meiner gespeicherten Fahrraeder sehen,
> damit ich meine Favoriten schnell vergleichen kann.

**Akzeptanzkriterien:**
- Eigener Tab/Seite "Meine Favoriten" zeigt alle gespeicherten Raeder
- Raeder koennen aus der Favoritenliste entfernt werden
- Leerer Zustand mit hilfreicher Meldung, wenn keine Favoriten vorhanden
- Gespeicherte Raeder koennen in die Vergleichsansicht uebernommen werden

---

**US-0.5: Notizen zu gespeicherten Raedern**
> Als angemeldeter Nutzer moechte ich Notizen zu meinen gespeicherten Raedern hinzufuegen,
> damit ich mir Gedanken oder Bewertungen merken kann.

**Akzeptanzkriterien:**
- Jeder gespeicherte Favorit hat ein optionales Notiz-Feld
- Notiz kann erstellt, bearbeitet und geloescht werden
- Notizen sind nur fuer den jeweiligen Nutzer sichtbar

---

**US-0.6: Konto loeschen (DSGVO Art. 17)**
> Als angemeldeter Nutzer moechte ich mein Konto und alle meine Daten loeschen koennen,
> damit ich mein Recht auf Vergessenwerden ausueben kann.

**Akzeptanzkriterien:**
- Button "Konto loeschen" in den Profil-Einstellungen
- Sicherheitsabfrage vor der Loeschung ("Bist du sicher?")
- Cascade Delete: Alle Favoriten, Notizen und Session-Daten werden entfernt
- Nutzer wird nach Loeschung ausgeloggt und auf die Startseite weitergeleitet

---

**US-0.7: Daten-Export (DSGVO Art. 20)**
> Als angemeldeter Nutzer moechte ich alle meine gespeicherten Daten als JSON exportieren koennen,
> damit ich mein Recht auf Datenportabilitaet wahrnehmen kann.

**Akzeptanzkriterien:**
- Button "Meine Daten exportieren" in den Profil-Einstellungen
- Export enthaelt: Profildaten, alle gespeicherten Fahrraeder, alle Notizen
- Download als `.json`-Datei
- Keine Daten anderer Nutzer im Export enthalten

---

**US-0.8: Datenschutzerklaerung**
> Als Nutzer moechte ich eine Datenschutzerklaerung einsehen koennen,
> damit ich weiss, wie meine Daten verarbeitet werden.

**Akzeptanzkriterien:**
- Seite `/datenschutz` mit verstaendlicher Datenschutzerklaerung auf Deutsch
- Erreichbar aus dem Footer und von der Registrierungsseite
- Beschreibt: Welche Daten gespeichert werden, warum, wie lange, und Nutzerrechte
- Hinweis auf Einwilligung bei der Registrierung

---

**US-0.9: Testabdeckung Kernfunktionen**
> Als Entwickler moechte ich automatisierte Tests fuer die Kernfunktionen haben,
> damit ich Aenderungen zuverlaessig durchfuehren kann, ohne bestehende Features zu brechen.

**Akzeptanzkriterien:**
- Unit-Tests fuer Adapter-Parsing-Logik (mindestens 1 Test pro Adapter)
- Unit-Tests fuer Filter- und Such-Logik
- API-Route-Tests: Auth-Guard prueft, dass unauthentifizierte Requests abgelehnt werden
- API-Route-Tests: Nutzer kann nur eigene Favoriten sehen/loeschen
- Alle Tests laufen im CI (Vitest)

---

### Epic 1: Generisches Produktmodell

**US-1.1: Generisches Produkt-Schema**
> Als Entwickler moechte ich ein generisches Produkt-Schema mit dynamischen Attributen,
> damit ich beliebige Produktkategorien abbilden kann, ohne das Datenmodell zu aendern.

**Akzeptanzkriterien:**
- Ein `Product`-Interface mit festen Basisfeldern (name, brand, price, dealer) und einer dynamischen `attributes`-Map existiert
- Zod-Validierung stellt sicher, dass Pflichtfelder vorhanden sind
- Bestehende Bike-Daten koennen als `Product` mit `categorySlug: "fahrraeder"` dargestellt werden

---

**US-1.2: Produktkategorie-Konfiguration**
> Als Entwickler moechte ich Produktkategorien als Konfiguration definieren koennen,
> damit neue Kategorien ohne Code-Aenderungen an der UI hinzugefuegt werden koennen.

**Akzeptanzkriterien:**
- Eine `ProductCategory`-Konfiguration enthaelt Name, Slug, Icon und Attribut-Definitionen
- Attribut-Definitionen spezifizieren Typ, Einheit, Filter-/Vergleichs-/Sortierbarkeit
- Mindestens die Kategorie "Fahrraeder" ist konfiguriert und bildet den Status quo ab

---

**US-1.3: Migration Bike-Adapter zu Product-Adapter**
> Als Entwickler moechte ich die bestehenden Bike-Adapter auf das generische ProductAdapter-Interface migrieren,
> damit sie in das neue System integriert sind, ohne Funktionalitaet zu verlieren.

**Akzeptanzkriterien:**
- Alle bestehenden Adapter implementieren das `ProductAdapter`-Interface
- Die zurueckgegebenen Produkte enthalten alle bisherigen Bike-Felder als Attribute
- Bestehende Tests laufen weiterhin erfolgreich

---

**US-1.4: Migration SavedBike zu SavedProduct**
> Als Entwickler moechte ich das `SavedBike`-Modell zu einem generischen `SavedProduct`-Modell migrieren,
> damit Nutzer Produkte aus beliebigen Kategorien speichern koennen.

**Akzeptanzkriterien:**
- Prisma-Migration von `SavedBike` zu `SavedProduct` mit `categorySlug`-Feld
- Bestehende gespeicherte Fahrraeder werden automatisch migriert
- Cascade Delete funktioniert weiterhin

---

### Epic 2: Dynamische Attribut-Definitionen

**US-2.1: Attribut-basierte Filter**
> Als Nutzer moechte ich Produkte nach kategoriespezifischen Kriterien filtern koennen,
> damit ich schnell die fuer mich relevanten Produkte finde.

**Akzeptanzkriterien:**
- Die Filter-Sidebar wird dynamisch aus den Attribut-Definitionen der aktuellen Kategorie generiert
- `number`-Attribute werden als Bereichs-Slider dargestellt
- `boolean`-Attribute werden als Checkbox dargestellt
- `enum`-Attribute werden als Multi-Select-Dropdown dargestellt
- Filter werden client-seitig angewendet (kein Neuladen)

---

**US-2.2: Attribut-basierte Vergleichstabelle**
> Als Nutzer moechte ich ausgewaehlte Produkte anhand ihrer kategoriespezifischen Attribute vergleichen,
> damit ich die Unterschiede auf einen Blick erkenne.

**Akzeptanzkriterien:**
- Die Vergleichstabelle zeigt alle als `comparable` markierten Attribute
- Attribute mit `highlight: 'min'` heben den niedrigsten Wert gruen hervor (z.B. Preis)
- Attribute mit `highlight: 'max'` heben den hoechsten Wert gruen hervor (z.B. VRAM)
- `boolean`-Attribute zeigen Haekchen/Kreuz an
- Einheiten werden korrekt angezeigt

---

**US-2.3: Attribut-basierte Sortierung**
> Als Nutzer moechte ich Produkte nach kategoriespezifischen Attributen sortieren koennen,
> damit ich z.B. Grafikkarten nach VRAM oder Preis ordnen kann.

**Akzeptanzkriterien:**
- Sortier-Dropdown zeigt alle als `sortable` markierten Attribute
- Sortierung nach aufsteigend/absteigend moeglich
- Standard-Sortierung wird aus der Kategorie-Konfiguration uebernommen

---

### Epic 3: Kategorie-Navigation

**US-3.1: Kategorie-Auswahl**
> Als Nutzer moechte ich zwischen verschiedenen Produktkategorien wechseln koennen,
> damit ich z.B. von Fahrraedern zu Grafikkarten navigieren kann.

**Akzeptanzkriterien:**
- Kategorie-Switcher in der Hauptnavigation (Tabs oder Dropdown)
- Jede Kategorie hat ein eigenes Icon
- URL aendert sich beim Wechsel (z.B. `/kategorie/grafikkarten`)
- Filter und Suche werden beim Kategorie-Wechsel zurueckgesetzt

---

**US-3.2: Kategorie-spezifische Startseite**
> Als Nutzer moechte ich beim Oeffnen einer Kategorie sofort die relevanten Produkte sehen,
> damit ich ohne Umwege mit dem Vergleichen starten kann.

**Akzeptanzkriterien:**
- Jede Kategorie zeigt ihre Produkte im gewohnten Grid-Layout
- Produktkarten zeigen die wichtigsten Attribute der jeweiligen Kategorie
- Leerer Zustand mit hilfreicher Meldung, wenn keine Produkte verfuegbar

---

**US-3.3: Kategorie-uebergreifende Favoriten**
> Als Nutzer moechte ich meine gespeicherten Produkte aus allen Kategorien einsehen koennen,
> damit ich einen Gesamtueberblick ueber meine Merkliste habe.

**Akzeptanzkriterien:**
- Favoriten-Seite zeigt gespeicherte Produkte, gruppiert nach Kategorie
- Filtern nach Kategorie innerhalb der Favoriten moeglich
- Kategorie-Badge auf jeder gespeicherten Produktkarte

---

### Epic 4: Neue Produktkategorien hinzufuegen

**US-4.1: Hardware-Haendler-Adapter**
> Als Entwickler moechte ich Adapter fuer Hardware-Haendler (z.B. Mindfactory, Alternate) erstellen,
> damit Produkte aus diesen Quellen aggregiert werden koennen.

**Akzeptanzkriterien:**
- Mindestens ein Hardware-Haendler-Adapter implementiert
- Adapter liefert Produkte im generischen `Product`-Format
- Adapter extrahiert kategoriespezifische Attribute (z.B. VRAM, Sockel)
- Fehlerbehandlung: Bei Ausfall des Haendlers werden andere Quellen weiterhin angezeigt

---

**US-4.2: Kategorie "Grafikkarten"**
> Als Nutzer moechte ich Grafikkarten von verschiedenen Haendlern vergleichen koennen,
> damit ich das beste Angebot fuer meine Wunsch-GPU finde.

**Akzeptanzkriterien:**
- Kategorie "Grafikkarten" mit Attributen: Preis, VRAM, Hersteller, Chip-Modell, Boost-Takt, TDP
- Filter nach VRAM, Hersteller (NVIDIA/AMD/Intel), Preisbereich
- Vergleich hebt niedrigsten Preis und hoechsten VRAM hervor
- Mindestens ein Haendler liefert Grafikkarten-Daten

---

**US-4.3: Kategorie "Motherboards"**
> Als Nutzer moechte ich Motherboards vergleichen koennen,
> damit ich das passende Board fuer mein System finde.

**Akzeptanzkriterien:**
- Kategorie "Motherboards" mit Attributen: Preis, Sockel, Formfaktor, WLAN-6, RAM-Slots, Chipsatz
- Filter nach Sockel, Formfaktor, WLAN-6 (ja/nein), Preisbereich
- Vergleich zeigt WLAN-6 als Haekchen/Kreuz
- Boolean-Filter fuer WLAN-6 funktioniert korrekt

---

### Epic 5: Erweiterte Vergleichsfunktionen

**US-5.1: Benutzerdefinierte Vergleichskriterien**
> Als Nutzer moechte ich selbst waehlen koennen, welche Attribute in der Vergleichstabelle angezeigt werden,
> damit ich mich auf die fuer mich relevanten Kriterien konzentrieren kann.

**Akzeptanzkriterien:**
- Checkbox-Liste ueber der Vergleichstabelle zum Ein-/Ausblenden von Attributen
- Auswahl wird im Local Storage gespeichert
- Standard: Alle `comparable`-Attribute sind sichtbar

---

**US-5.2: Gewichteter Vergleich (Nice-to-have)**
> Als Nutzer moechte ich Vergleichskriterien gewichten koennen,
> damit mir ein Score angezeigt wird, der meine Prioritaeten widerspiegelt.

**Akzeptanzkriterien:**
- Nutzer kann numerischen Attributen eine Gewichtung (1-5 Sterne) geben
- Ein gewichteter Score wird berechnet und als "Empfehlung" angezeigt
- Score-Berechnung ist transparent und nachvollziehbar
- Feature ist optional und standardmaessig ausgeblendet

---

**US-5.3: Preishistorie**
> Als Nutzer moechte ich die Preisentwicklung eines Produkts ueber die Zeit sehen,
> damit ich entscheiden kann, ob der aktuelle Preis gut ist.

**Akzeptanzkriterien:**
- Preise werden bei jedem Scraping-Lauf historisch gespeichert
- Einfaches Liniendiagramm zeigt den Preisverlauf der letzten 30 Tage
- Verfuegbar in der Detailansicht jedes Produkts

---

### Epic 6: Admin-Features

**US-6.1: Kategorie-Verwaltung (Admin)**
> Als Admin moechte ich neue Produktkategorien ueber eine Admin-Oberflaeche anlegen koennen,
> damit ich keine Code-Aenderungen fuer neue Kategorien brauche.

**Akzeptanzkriterien:**
- Admin-Seite zum Erstellen/Bearbeiten von Produktkategorien
- Attribut-Definitionen koennen per Formular hinzugefuegt werden
- Validierung: Slug muss eindeutig sein, mindestens ein Attribut erforderlich
- Aenderungen werden sofort wirksam

---

**US-6.2: Adapter-Status-Dashboard**
> Als Admin moechte ich den Status aller Datenquellen-Adapter sehen,
> damit ich erkenne, wenn eine Quelle ausfaellt oder fehlerhafte Daten liefert.

**Akzeptanzkriterien:**
- Dashboard zeigt pro Adapter: letzter erfolgreicher Lauf, Anzahl Produkte, Fehler
- Warnung bei Adaptern, die laenger als 24h keine Daten geliefert haben
- Manueller "Jetzt aktualisieren"-Button pro Adapter

---

## Technische Ueberlegungen

### Abwaertskompatibilitaet
- Die Migration muss sicherstellen, dass bestehende Bike-Daten und Favoriten erhalten bleiben
- Die URL `/` kann auf `/kategorie/fahrraeder` weiterleiten
- Bestehende API-Endpunkte bleiben initial erhalten und werden schrittweise migriert

### Validierung
- Dynamische Zod-Schemas werden zur Laufzeit aus den Attribut-Definitionen generiert
- Pflichtfelder (name, price, dealer) werden immer validiert
- Kategoriespezifische Attribute werden gegen ihre Typ-Definition validiert

### Performance
- Produkte werden weiterhin server-seitig geladen und gecacht
- Client-seitige Filterung bleibt fuer schnelle Interaktion
- Kategorien mit vielen Produkten bekommen Pagination

### DSGVO
- Erweiterung der Datenschutzerklaerung um neue Produktkategorien
- Export-Funktion (Art. 20) exportiert Favoriten aus allen Kategorien
- Loeschung (Art. 17) entfernt alle gespeicherten Produkte des Nutzers
