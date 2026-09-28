export type GameMode = "easy" | "realism";
export type Cabin = "y" | "j" | "f";

export type PaxSeats = { y: number; j: number; f: number };
export type PaxDemand = PaxSeats;
export type CargoMix = { large: number; heavy: number };

const PAX_AUTO = {
  easy: { y: [0.4, 170], j: [0.8, 560], f: [1.2, 1200] },
  realism: { y: [0.3, 150], j: [0.6, 500], f: [0.9, 1000] },
} as const;

const CARGO_AUTO = {
  easy: {
    large: [0.0948283724581252, 85.2045432642377],
    heavy: [0.0689663577640275, 28.2981124272893],
  },
  realism: {
    large: [0.0776321822039374, 85.0567600367807],
    heavy: [0.0517742799409248, 24.6369915396414],
  },
} as const;

const PAX_MARKUP = { y: 1.1, j: 1.08, f: 1.06 } as const;
const CARGO_MARKUP = { large: 1.1, heavy: 1.08 } as const;
const PAX_UNITS: Record<Cabin, number> = { y: 1, j: 2, f: 3 };

/** Index of an undirected pair in a strictly upper-triangular n×n table. */
export function routePairIndex(a: number, b: number, n: number): number {
  const i = a < b ? a : b;
  const j = a < b ? b : a;
  return (i * (2 * n - i - 1)) / 2 + (j - i - 1);
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function speedMultiplier(mode: GameMode): number {
  return mode === "easy" ? 1.5 : 1;
}

export function cruiseKmh(baseSpeed: number, mode: GameMode, ci = 200): number {
  const u = baseSpeed * speedMultiplier(mode);
  return u * (0.0035 * ci + 0.3);
}

export function flightHours(
  distanceKm: number,
  baseSpeed: number,
  mode: GameMode,
  ci = 200,
): number {
  return distanceKm / cruiseKmh(baseSpeed, mode, ci);
}

/** Slowest CI whose block time still finishes inside the departure slot. */
export function ciForSlot(
  distanceKm: number,
  baseSpeed: number,
  mode: GameMode,
  slotHours: number,
): { ci: number; hours: number } | null {
  const fastest = flightHours(distanceKm, baseSpeed, mode, 200);
  if (fastest > slotHours + 1e-4) return null;
  let ci = 200;
  let hours = fastest;
  for (let next = 199; next >= 0; next -= 1) {
    const t = flightHours(distanceKm, baseSpeed, mode, next);
    if (t > slotHours + 1e-4) break;
    ci = next;
    hours = t;
  }
  return { ci, hours };
}

function clampCi(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(200, Math.max(0, Math.round(value)));
}

/**
 * Cost index for a target block time.
 * Without `around`, this is the slowest index at or above `minCi` that still
 * finishes inside the slot. With `around`, the index stays within that many
 * points of `optimalCi` and is the one in that band closest to it.
 */
export function recommendCi(input: {
  distanceKm: number;
  baseSpeed: number;
  mode: GameMode;
  slotHours: number;
  minCi: number;
  optimalCi: number;
  around: number | null;
  windowHours: number;
}): { ci: number; hours: number } | null {
  const minCi = clampCi(input.minCi);
  const optimal = clampCi(input.optimalCi);
  const around = input.around == null || !Number.isFinite(input.around) ? null : Math.max(0, Math.round(input.around));
  const low = around == null ? minCi : Math.max(minCi, optimal - around);
  const high = around == null ? 200 : Math.min(200, optimal + around);
  if (low > high) return null;

  if (around == null) {
    const stretched = ciForSlot(input.distanceKm, input.baseSpeed, input.mode, input.slotHours);
    if (!stretched) return null;
    const ci = Math.max(stretched.ci, minCi);
    const hours =
      ci === stretched.ci
        ? stretched.hours
        : flightHours(input.distanceKm, input.baseSpeed, input.mode, ci);
    if (hours > input.slotHours + 1e-4) return null;
    if (input.slotHours - hours > input.windowHours) return null;
    return { ci, hours };
  }

  let best: { ci: number; hours: number; distance: number } | null = null;
  for (let ci = low; ci <= high; ci += 1) {
    const hours = flightHours(input.distanceKm, input.baseSpeed, input.mode, ci);
    if (hours > input.slotHours + 1e-4) continue;
    if (input.slotHours - hours > input.windowHours) continue;
    const distance = Math.abs(ci - optimal);
    if (!best || distance < best.distance || (distance === best.distance && ci > best.ci)) {
      best = { ci, hours, distance };
    }
  }
  return best ? { ci: best.ci, hours: best.hours } : null;
}

export function floorTo(value: number, step: number): number {
  return Math.floor(value / step + 1e-9) * step;
}

export function autoPax(distanceKm: number, mode: GameMode): PaxSeats {
  const c = PAX_AUTO[mode];
  return {
    y: c.y[0] * distanceKm + c.y[1],
    j: c.j[0] * distanceKm + c.j[1],
    f: c.f[0] * distanceKm + c.f[1],
  };
}

export function optimalPax(distanceKm: number, mode: GameMode): PaxSeats {
  const auto = autoPax(distanceKm, mode);
  return {
    y: floorTo(auto.y * PAX_MARKUP.y, 1),
    j: floorTo(auto.j * PAX_MARKUP.j, 1),
    f: floorTo(auto.f * PAX_MARKUP.f, 1),
  };
}

export function autoCargo(distanceKm: number, mode: GameMode) {
  const c = CARGO_AUTO[mode];
  return {
    large: c.large[0] * distanceKm + c.large[1],
    heavy: c.heavy[0] * distanceKm + c.heavy[1],
  };
}

export function optimalCargo(distanceKm: number, mode: GameMode) {
  const auto = autoCargo(distanceKm, mode);
  return {
    large: floorTo(auto.large * CARGO_MARKUP.large, 0.01),
    heavy: floorTo(auto.heavy * CARGO_MARKUP.heavy, 0.01),
  };
}

export function cabinOrder(distanceKm: number, mode: GameMode): Cabin[] {
  const price = optimalPax(distanceKm, mode);
  return (["y", "j", "f"] as Cabin[])
    .map((cabin) => ({ cabin, score: price[cabin] / PAX_UNITS[cabin] }))
    .sort((a, b) => b.score - a.score)
    .map((row) => row.cabin);
}

export function configurePax(input: {
  capacity: number;
  demand: PaxDemand;
  flightsPerDay: number;
  distanceKm: number;
  mode: GameMode;
}): { seats: PaxSeats; order: Cabin[]; unused: number; shortfall: PaxSeats } {
  const flights = Math.max(1, Math.floor(input.flightsPerDay));
  const order = cabinOrder(input.distanceKm, input.mode);
  const perFlight: PaxSeats = {
    y: Math.floor(input.demand.y / flights),
    j: Math.floor(input.demand.j / flights),
    f: Math.floor(input.demand.f / flights),
  };
  const seats: PaxSeats = { y: 0, j: 0, f: 0 };
  let remaining = input.capacity;
  for (const cabin of order) {
    const take = Math.min(perFlight[cabin], Math.floor(remaining / PAX_UNITS[cabin]));
    seats[cabin] = Math.max(0, take);
    remaining -= seats[cabin] * PAX_UNITS[cabin];
  }
  const used = seats.y + seats.j * 2 + seats.f * 3;
  return {
    seats,
    order,
    unused: input.capacity - used,
    shortfall: {
      y: Math.max(0, perFlight.y - seats.y),
      j: Math.max(0, perFlight.j - seats.j),
      f: Math.max(0, perFlight.f - seats.f),
    },
  };
}

/** Large load at 100% holds 70% of the published cargo capacity. */
export function configureCargo(input: {
  capacityLbs: number;
  largeDemand: number;
  heavyDemand: number;
  flightsPerDay: number;
  distanceKm: number;
  mode: GameMode;
}): { mix: CargoMix; largeLbs: number; heavyLbs: number; preferLarge: boolean } {
  const flights = Math.max(1, Math.floor(input.flightsPerDay));
  const largePer = input.largeDemand / flights;
  const heavyPer = input.heavyDemand / flights;
  const preferLarge = input.mode === "realism" || input.distanceKm < 23908;
  const largeFull = input.capacityLbs * 0.7;

  if (preferLarge) {
    if (largePer >= largeFull) {
      return { mix: { large: 100, heavy: 0 }, largeLbs: largeFull, heavyLbs: 0, preferLarge };
    }
    const large = largeFull === 0 ? 0 : (largePer / largeFull) * 100;
    const heavy = 100 - large;
    return {
      mix: { large, heavy },
      largeLbs: largePer,
      heavyLbs: (heavy / 100) * input.capacityLbs,
      preferLarge,
    };
  }

  const heavy = Math.min(100, input.capacityLbs === 0 ? 0 : (heavyPer / input.capacityLbs) * 100);
  const large = 100 - heavy;
  return {
    mix: { large, heavy },
    largeLbs: (large / 100) * largeFull,
    heavyLbs: (heavy / 100) * input.capacityLbs,
    preferLarge,
  };
}

export function ceilCents(distanceKm: number): number {
  return Math.ceil(distanceKm * 100 - 1e-9) / 100;
}

export function fuelLbs(input: {
  consumption: number;
  distanceKm: number;
  ci: number;
  fuelTraining?: number;
}): number {
  const training = 1 - (input.fuelTraining ?? 0) / 100;
  const ciFactor = input.ci / 500 + 0.6;
  return training * ceilCents(input.distanceKm) * input.consumption * ciFactor;
}

export function co2QuotasPax(input: {
  consumption: number;
  distanceKm: number;
  seats: PaxSeats;
  loadFactor: number;
  ci: number;
  co2Training?: number;
}): number {
  const training = 1 - (input.co2Training ?? 0) / 100;
  const ciFactor = input.ci / 2000 + 0.9;
  const seatsTotal = input.seats.y + input.seats.j + input.seats.f;
  const paxMass =
    (input.seats.y + input.seats.j * 2 + input.seats.f * 3) * input.loadFactor;
  return (
    training *
    (ceilCents(input.distanceKm) * input.consumption * paxMass + seatsTotal) *
    ciFactor
  );
}

/** Guide model: listed reputation is roughly the cabin fill. */
export function loadFactor(reputation: number): number {
  return Math.min(1, Math.max(0, reputation / 100));
}

export function paxRevenue(seats: PaxSeats, prices: PaxSeats, fill: number): number {
  return (seats.y * prices.y + seats.j * prices.j + seats.f * prices.f) * fill;
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function hoursLabel(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function kmLabel(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}
