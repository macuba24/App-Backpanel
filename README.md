# Backpanel

Steuerung für die Kunden-App eines Einzelhändlers. Geschäftsführer pflegen hier Marke, Modul-Schalter und die Inhalte der Module. Die App im Laden liest dieselbe Konfiguration über eine öffentliche JSON-Schnittstelle.

Die Oberfläche ist Deutsch. Code, Typen und Kommentare sind Englisch.

Ein Kundenkonto steuert genau eine App.

## Voraussetzungen

- Node.js 20 oder neuer
- Docker, falls PostgreSQL lokal über Compose laufen soll
- Alternativ eine bestehende PostgreSQL-Datenbank, zum Beispiel Supabase. Die Verbindungszeichenkette wird genauso in `DATABASE_URL` eingetragen.

## PostgreSQL starten

Im Projektordner:

```powershell
docker compose up -d
```

Der Dienst heißt `postgres:16`, Datenbank `backpanel`, Benutzer und Passwort `postgres`, Port `5432`. Die Daten liegen im Volume `backpanel_pg`.

## Umgebung

`.env.example` nach `.env` kopieren oder die vorhandene lokale `.env` verwenden:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backpanel?schema=public"
```

Eine Supabase-Verbindungszeichenkette funktioniert an derselben Stelle.

## Datenbank vorbereiten

```powershell
npm run db:generate
npm run db:push
npm run db:seed
```

`db:push` legt die Tabellen `Tenants`, `AppConfigs` und `Users` an. `db:seed` legt den Demomandanten, seine eine App und den Login an und kann wiederholt ausgeführt werden.

Optional: `npm run db:studio`.

## Entwicklungsserver

```powershell
npm run dev
```

Die Oberfläche liegt auf [http://localhost:3000](http://localhost:3000). Start und Build laufen über Webpack. Auf diesem Windows-System liefert `readlink` für normale Dateien `EISDIR`; `scripts/patch-readlink.cjs` mappt das auf `EINVAL`, damit Next.js den Build nicht abbricht. Turbopack scheitert hier zusätzlich an einer Prisma-Verknüpfung.

| Seite | Route |
| --- | --- |
| Übersicht | `/` und `/dashboard` |
| Modul-Manager | `/dashboard/modules` |
| App-Design | `/dashboard/design` |

Ohne Anmeldung leitet das Panel auf `/login`. Ist die Datenbank nicht erreichbar, zeigt das Panel nach der Anmeldung einen Hinweis statt einer Fehlseite. Die Anmeldung selbst bleibt erreichbar und meldet den Fehler beim Absenden.

## Anmeldung

Demo-Zugang für Sportladen Müller:

- E-Mail: `rainer.hampicke@hampacorequality.de`
- Passwort: `101010`

Das Konto hängt fest an der App `sport-mueller`. Es gibt keinen Wechsel zu einer anderen App. Die öffentliche Schnittstelle `GET /api/v1/app-config/[slug]` bleibt ohne diese Anmeldung lesbar, damit die Kunden-Apps sie weiter laden können.

In `.env` muss `SESSION_SECRET` stehen (mindestens 16 Zeichen). Das Cookie `bp_session` ist httpOnly und enthält nur eine signierte Sitzung, kein Passwort.

## Demo-Mandant

- Name: Sportladen Müller
- Slug: `sport-mueller`
- API-Schlüssel: `demo-sport-mueller-key`

Aktiv im Seed: Stempelpass, Direct Feedback, Geburtstagsgruß, Saisongruß, Event-Kalender, Flash-Deal. Die übrigen Module sind ausgefüllt, aber ausgeschaltet.

## Öffentliche API

`GET /api/v1/app-config/sport-mueller`

Ohne Schlüssel ist die Konfiguration lesbar. Das ist für die Kunden-App gedacht und setzt keine Anmeldung im Händler-Panel voraus. Wird `x-api-key` oder `Authorization: Bearer <apiKey>` gesendet, muss der Wert zum Mandanten passen, sonst antwortet die Schnittstelle mit `401`.

```powershell
curl http://localhost:3000/api/v1/app-config/sport-mueller
```

```powershell
curl -H "x-api-key: demo-sport-mueller-key" http://localhost:3000/api/v1/app-config/sport-mueller
```

```powershell
curl -H "Authorization: Bearer demo-sport-mueller-key" http://localhost:3000/api/v1/app-config/sport-mueller
```

Die Antwort enthält `tenant`, `branding` und `modules`. In `modules` stehen nur Einträge mit `enabled: true`, jeweils mit ihrem Schlüssel und allen Feldern. Ausgeschaltete Module fehlen. Fehler sind JSON ohne Stacktrace, zum Beispiel `{ "error": "Tenant not found" }`.

Die erfolgreiche Antwort setzt `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.

## Form der Modul-Konfiguration

`AppConfig.activeModules` ist ein JSON-Objekt, kein String-Array. Jede Karte im Modul-Manager speichert nur ihre eigenen Schlüssel und lässt die übrigen Module stehen.

Schlüssel:

- `stampCard` — Stempelanzahl, Belohnungstext, Einlöse-Code
- `wheel` — Gewinnwahrscheinlichkeit, Abklingzeit, Gewinngutscheine
- `challengePass` — Zielanzahl Besuche, Belohnung
- `directFeedback` — Frage, E-Mail bei 1–3 Sternen, Google-URL bei 5 Sternen. Die Bewertung ist fest auf 5 Sterne.
- `quickPoll` — Frage und Antwortoptionen
- `birthdayGreeting` — Titel, Nachricht, Rabatt-Typ (`percent`, `fixed`, `gift`), Wert, Bedingungen, Gültigkeit in Tagen, Barcode-Typ
- `seasonalGreeting` — Banner, Text, Bild-URL, Start- und Enddatum
- `eventCalendar` — Liste von Events mit Name, Datum, Ort, Beschreibung, Teilnahme-Button
- `pushCenter` — Titel, Text, Deep-Link. „Nachricht senden“ setzt `lastQueuedAt`. Es gibt keinen Push-Dienst.
- `flashDeal` — Titel, Rabattwert, Countdown-Ende

Vorgaben stehen in `src/modules/defaults.ts`. Das Zod-Schema und die TypeScript-Typen stehen in `src/modules/schema.ts`. Bezeichnungen und Kategorien stehen in `src/modules/registry.ts`.

## Neues Modul

1. Schlüssel im Zod-Schema in `src/modules/schema.ts` ergänzen. Der Typ `ActiveModulesConfig` folgt daraus.
2. Dieselben Felder in `src/modules/defaults.ts` vorbelegen, im Demo-Objekt nach Bedarf.
3. Bezeichnung, Beschreibung und Kategorie in `src/modules/registry.ts` eintragen und den Schlüssel der passenden Kategorie zuordnen.
4. Eine Karte oder einen Abschnitt unter `src/components/dashboard` ergänzen, der die Felder rendert und über die bestehende Speicher-Action schreibt. Den neuen Schlüssel in `parseActiveModules` (`src/lib/modules.ts`) aufnehmen; TypeScript meldet das, falls er fehlt.

Die Übersicht liest die Schalter aus der Registry. Die öffentliche API gibt jedes Modul mit `enabled: true` automatisch aus. Es ist keine eigene Seite und keine eigene Tabelle nötig.
