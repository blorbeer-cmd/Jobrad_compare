import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklaerung – JobRad Vergleich",
};

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Datenschutzerklaerung</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Verantwortlicher</h2>
        <p className="text-muted-foreground">
          Verantwortlich fuer die Datenverarbeitung im Sinne der DSGVO ist der Betreiber dieses
          internen Vergleichstools. Bei Fragen zum Datenschutz wende dich bitte an deinen
          Systemadministrator.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Welche Daten wir speichern</h2>
        <p className="text-muted-foreground">
          Wir speichern nur die fuer den Betrieb des Tools notwendigen Daten:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li><strong>E-Mail-Adresse</strong> — fuer die Anmeldung (Magic Link)</li>
          <li><strong>Anzeigename</strong> — optional, fuer die Personalisierung</li>
          <li><strong>Gespeicherte Fahrraeder</strong> — deine Favoriten und Vergleichslisten</li>
          <li><strong>Notizen</strong> — persoenliche Anmerkungen zu gespeicherten Raedern</li>
          <li><strong>Session-Daten</strong> — fuer die sichere Sitzungsverwaltung</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Zweck der Datenverarbeitung</h2>
        <p className="text-muted-foreground">
          Deine Daten werden ausschliesslich verwendet, um dir die Funktionen des Vergleichstools
          bereitzustellen: Anmeldung, Speichern von Favoriten und persoenliche Notizen.
          Es findet kein Tracking, keine Profilbildung und keine Weitergabe an Dritte statt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Rechtsgrundlage</h2>
        <p className="text-muted-foreground">
          Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
          die du bei der Registrierung erteilst. Du kannst diese Einwilligung jederzeit widerrufen,
          indem du dein Konto loeschst.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Deine Rechte</h2>
        <p className="text-muted-foreground">
          Du hast folgende Rechte bezueglich deiner personenbezogenen Daten:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>
            <strong>Recht auf Auskunft (Art. 15 DSGVO)</strong> — Du kannst in deinem Profil
            alle gespeicherten Daten einsehen.
          </li>
          <li>
            <strong>Recht auf Loeschung (Art. 17 DSGVO)</strong> — Du kannst dein Konto und alle
            damit verbundenen Daten jederzeit loeschen. Nutze dafuer die Funktion
            &quot;Konto loeschen&quot; in deinen Profileinstellungen.
          </li>
          <li>
            <strong>Recht auf Datenueberitragbarkeit (Art. 20 DSGVO)</strong> — Du kannst alle
            deine Daten als JSON-Datei exportieren. Nutze dafuer die Funktion
            &quot;Meine Daten exportieren&quot; in deinen Profileinstellungen.
          </li>
          <li>
            <strong>Recht auf Widerruf (Art. 7 Abs. 3 DSGVO)</strong> — Du kannst deine
            Einwilligung jederzeit widerrufen, indem du dein Konto loeschst.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Speicherdauer</h2>
        <p className="text-muted-foreground">
          Deine Daten werden gespeichert, solange dein Konto besteht. Bei Loeschung deines Kontos
          werden alle personenbezogenen Daten (Profil, Favoriten, Notizen, Sessions) unverzueglich
          und vollstaendig entfernt. Es werden keine Daten nach der Kontoloeschung aufbewahrt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Sicherheit</h2>
        <p className="text-muted-foreground">
          Wir schuetzen deine Daten durch:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Verschluesselte Uebertragung (HTTPS)</li>
          <li>Sichere, HttpOnly Session-Cookies</li>
          <li>Zugriffsbeschraenkung auf eingeladene Nutzer (Invite-Only)</li>
          <li>Nutzerdaten sind nur fuer den jeweiligen Nutzer sichtbar</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Cookies</h2>
        <p className="text-muted-foreground">
          Dieses Tool verwendet ausschliesslich technisch notwendige Cookies fuer die
          Sitzungsverwaltung. Es werden keine Tracking- oder Analyse-Cookies eingesetzt.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Stand: Maerz 2026
      </p>
    </div>
  );
}
