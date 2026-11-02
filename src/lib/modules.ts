import type { Prisma } from "@prisma/client";

import { defaultActiveModules } from "@/modules/defaults";
import { moduleOrder } from "@/modules/registry";
import {
  activeModulesSchema,
  type ActiveModulesConfig,
  type ModuleKey,
} from "@/modules/schema";
import { isWeeklyOfferActive } from "@/modules/weekly-offer";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Order the preview used before a merchant dragged anything.
 * PostgreSQL jsonb does not keep object key order, so this sequence is stored
 * as the `order` array inside `activeModules`.
 */
export const defaultFeatureOrder = [
  "stampCard",
  "challengePass",
  "birthdayGreeting",
  "seasonalGreeting",
  "eventCalendar",
  "directFeedback",
  "quickPoll",
  "wheel",
  "flashDeal",
  "periodOffers",
  "pushCenter",
  "photos",
  "orderSlip",
  "geofence",
] as const satisfies readonly ModuleKey[];

const featureOrderCoversModules: [Exclude<ModuleKey, (typeof defaultFeatureOrder)[number]>] extends [never]
  ? []
  : ["feature order is missing a module"] = [];
void featureOrderCoversModules;

function isModuleKey(value: string): value is ModuleKey {
  return (moduleOrder as readonly string[]).includes(value);
}

/** Known module keys, incoming ones first, then any key the list left out. */
export function normalizeModuleOrder(
  value: unknown,
  fallback: readonly ModuleKey[] = defaultFeatureOrder,
): ModuleKey[] {
  const seen = new Set<ModuleKey>();
  const order: ModuleKey[] = [];
  const incoming = Array.isArray(value) ? value : fallback;

  for (const item of incoming) {
    if (typeof item === "string" && isModuleKey(item) && !seen.has(item)) {
      seen.add(item);
      order.push(item);
    }
  }
  for (const key of fallback) {
    if (!seen.has(key)) order.push(key);
  }
  for (const key of moduleOrder) {
    if (!seen.has(key)) order.push(key);
  }
  return order;
}

export function readModuleOrder(value: unknown): ModuleKey[] {
  const source = isRecord(value) ? value : {};
  if (!Array.isArray(source.order) || source.order.length === 0) return normalizeModuleOrder(defaultFeatureOrder);
  return normalizeModuleOrder(source.order);
}

export function applyModuleOrder(modules: ActiveModulesConfig, order: readonly ModuleKey[]): ActiveModulesConfig {
  const normalized = normalizeModuleOrder(order);
  const ordered = {} as ActiveModulesConfig;
  for (const key of normalized) Object.assign(ordered, { [key]: modules[key] });
  return ordered;
}

/** Merge stored JSON onto defaults, keeping only modules that still match the schema. */
export function parseActiveModules(value: unknown): ActiveModulesConfig {
  const source = isRecord(value) ? value : {};

  const modules: ActiveModulesConfig = {
    stampCard: readModule("stampCard", source.stampCard),
    wheel: readModule("wheel", source.wheel),
    challengePass: readModule("challengePass", source.challengePass),
    directFeedback: readModule("directFeedback", source.directFeedback),
    quickPoll: readModule("quickPoll", source.quickPoll),
    birthdayGreeting: readModule("birthdayGreeting", source.birthdayGreeting),
    seasonalGreeting: readModule("seasonalGreeting", source.seasonalGreeting),
    eventCalendar: readModule("eventCalendar", source.eventCalendar),
    pushCenter: readModule("pushCenter", source.pushCenter),
    flashDeal: readModule("flashDeal", source.flashDeal),
    periodOffers: readModule("periodOffers", source.periodOffers),
    photos: readModule("photos", source.photos),
    orderSlip: readModule("orderSlip", source.orderSlip),
    geofence: readModule("geofence", source.geofence),
  };
  return applyModuleOrder(modules, readModuleOrder(value));
}

export function mergeActiveModules(
  current: ActiveModulesConfig,
  patch: Partial<ActiveModulesConfig>,
): ActiveModulesConfig {
  return {
    ...current,
    ...patch,
  };
}

export function toInputJson(value: ActiveModulesConfig, order?: readonly ModuleKey[]): Prisma.InputJsonValue {
  const normalized = normalizeModuleOrder(order ?? Object.keys(value));
  const ordered = applyModuleOrder(value, normalized);
  const serialized: unknown = JSON.parse(JSON.stringify({ ...ordered, order: normalized }));
  return serialized as Prisma.InputJsonValue;
}

/**
 * Copy used by the public app-config payload.
 * The week slot is emptied unless now is in [startsAt, endsAt), so an offer
 * outside its window is not presented as the current Angebot der Woche.
 * Day, month and the shared photos stay as stored. The admin still reads the full config.
 */
export function modulesForStorefront(config: ActiveModulesConfig, now: Date = new Date()): ActiveModulesConfig {
  if (isWeeklyOfferActive(config.periodOffers.week, now)) return config;
  return {
    ...config,
    periodOffers: {
      ...config.periodOffers,
      week: { ...defaultActiveModules.periodOffers.week },
    },
  };
}

export function enabledModules(config: ActiveModulesConfig): Partial<ActiveModulesConfig> {
  const modules: Partial<ActiveModulesConfig> = {};

  for (const key of Object.keys(config) as ModuleKey[]) {
    assignIfEnabled(modules, key, config[key]);
  }

  return modules;
}

function readModule<K extends ModuleKey>(key: K, patch: unknown): ActiveModulesConfig[K] {
  if (!isRecord(patch)) return defaultActiveModules[key];
  const base: unknown = defaultActiveModules[key];
  const candidate = isRecord(base) ? { ...base, ...patch } : patch;
  const parsed = activeModulesSchema.shape[key].safeParse(candidate);
  if (!parsed.success) return defaultActiveModules[key];
  return parsed.data as ActiveModulesConfig[K];
}

function assignIfEnabled<K extends ModuleKey>(
  target: Partial<ActiveModulesConfig>,
  key: K,
  value: ActiveModulesConfig[K],
) {
  if (value.enabled) {
    target[key] = value;
  }
}
