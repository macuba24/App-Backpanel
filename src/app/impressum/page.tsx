import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <main className="desk min-h-svh px-4 py-10 text-zinc-950">
      <article className="physical-card mx-auto grid max-w-2xl gap-6 rounded-xl px-6 py-6">
        <header className="grid gap-2">
          <img src="/hcq-logo.png" alt="" className="size-14 rounded-xl" />
          <h1 className="text-lg font-semibold tracking-tight">Impressum</h1>
          <p className="text-sm text-zinc-600">Angaben gemäß § 5 DDG</p>
        </header>

        <section className="grid gap-1 text-sm">
          <p className="font-semibold">Hampa Core Quality</p>
          <p>R. Hampicke</p>
          <p>Römerstraße 40</p>
          <p>56294 Münstermaifeld</p>
        </section>

        <section className="grid gap-1 text-sm">
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            E-Mail:{" "}
            <a className="underline" href="mailto:info@hampacorequality.de">
              info@hampacorequality.de
            </a>
          </p>
          <p>
            Festnetz:{" "}
            <a className="underline" href="tel:+492605848777">
              +49 (0)2605 848777
            </a>
          </p>
          <p>
            Mobil:{" "}
            <a className="underline" href="tel:+4915565594897">
              +49 (0)15565 594897
            </a>
          </p>
        </section>

        <section className="grid gap-1 text-sm">
          <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>R. Hampicke</p>
          <p>Römerstraße 40</p>
          <p>56294 Münstermaifeld</p>
        </section>

        <section className="grid gap-2 text-sm text-zinc-700">
          <h2 className="font-semibold text-zinc-950">Haftung für Inhalte</h2>
          <p>
            Für eigene Inhalte auf diesen Seiten sind wir nach den allgemeinen Gesetzen verantwortlich. Eine Pflicht,
            fremde Informationen ständig zu überwachen, besteht nicht. Sobald uns eine konkrete Rechtsverletzung bekannt
            wird, entfernen wir den betroffenen Inhalt.
          </p>
        </section>

        <section className="grid gap-2 text-sm text-zinc-700">
          <h2 className="font-semibold text-zinc-950">Haftung für Links</h2>
          <p>
            Für Inhalte verlinkter Seiten sind deren Betreiber verantwortlich. War ein Verstoß beim Setzen des Links
            nicht erkennbar, nehmen wir den Link heraus, sobald er uns bekannt wird.
          </p>
        </section>

        <p>
          <Link className="text-sm underline" href="/">
            Zurück zum Panel
          </Link>
        </p>
      </article>
    </main>
  );
}
