export type WeeklyOfferWindow = {
  startsAt: string | null;
  endsAt: string | null;
};

/**
 * Current offer of the week on the half-open interval [start, end).
 * The Zielzeitpunkt itself is already outside the window.
 * A missing or reversed range is never current.
 */
export function isWeeklyOfferActive(offer: WeeklyOfferWindow, now: Date = new Date()): boolean {
  const window = weeklyOfferBounds(offer);
  if (!window) return false;
  const time = now.getTime();
  return time >= window.start && time < window.end;
}

/** Both instants are required, and the end must be strictly later than the start. */
export function weeklyOfferWindowError(offer: WeeklyOfferWindow): string | null {
  if (!offer.startsAt) return "Startzeitpunkt ist erforderlich.";
  if (!offer.endsAt) return "Zielzeitpunkt ist erforderlich.";
  const window = weeklyOfferBounds(offer);
  if (!window) return "Der Zielzeitpunkt muss nach dem Startzeitpunkt liegen.";
  return null;
}

function weeklyOfferBounds(offer: WeeklyOfferWindow): { start: number; end: number } | null {
  if (!offer.startsAt || !offer.endsAt) return null;
  const start = Date.parse(offer.startsAt);
  const end = Date.parse(offer.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}
