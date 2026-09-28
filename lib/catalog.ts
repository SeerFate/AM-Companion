import aircraftData from "@/data/aircraft.json";
import airportData from "@/data/airports.json";
import { haversineKm, type GameMode } from "@/lib/am4";

export type Aircraft = {
  id: number;
  short: string;
  maker: string;
  name: string;
  engine: string;
  type: "pax" | "cargo" | "vip";
  speed: number;
  fuel: number;
  co2: number;
  cost: number;
  capacity: number;
  rwy: number;
  check: number;
  range: number;
  maint: number;
};

export type Airport = {
  iata: string;
  icao: string;
  name: string;
  full: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  rwy: number;
  market: number;
  hub: number;
};

export const aircraft = aircraftData as Aircraft[];
export const airports = airportData as Airport[];

const airportByIata = new Map(airports.map((airport) => [airport.iata, airport]));
const aircraftById = new Map(aircraft.map((plane) => [plane.id, plane]));

export function airport(iata: string): Airport | undefined {
  return airportByIata.get(iata.toUpperCase());
}

export function plane(id: number): Aircraft | undefined {
  return aircraftById.get(id);
}

export function engineVariants(kind: Aircraft["type"], name: string): Aircraft[] {
  return aircraft
    .filter((item) => item.type === kind && item.name === name)
    .sort((a, b) => b.speed - a.speed || a.engine.localeCompare(b.engine));
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: { rank: number; airport: Airport }[] = [];
  for (const item of airports) {
    const iata = item.iata.toLowerCase();
    const icao = item.icao.toLowerCase();
    const name = item.name.toLowerCase();
    const country = item.country.toLowerCase();
    let rank = 9;
    if (iata === q || icao === q) rank = 0;
    else if (iata.startsWith(q) || icao.startsWith(q)) rank = 1;
    else if (name.startsWith(q)) rank = 2;
    else if (name.includes(q) || country.includes(q)) rank = 3;
    else continue;
    hits.push({ rank, airport: item });
  }
  return hits
    .sort(
      (a, b) =>
        a.rank - b.rank || b.airport.market - a.airport.market || a.airport.name.localeCompare(b.airport.name),
    )
    .slice(0, limit)
    .map((hit) => hit.airport);
}

export function searchAircraft(query: string, kind?: Aircraft["type"], limit = 8): Aircraft[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return aircraft
    .filter((item) => (kind ? item.type === kind : true))
    .filter((item) => {
      const blob = `${item.name} ${item.short} ${item.engine} ${item.maker}`.toLowerCase();
      return blob.includes(q);
    })
    .slice(0, limit);
}

export function routeDistance(hubIata: string, destIata: string, stopoverIata = ""): {
  direct: number;
  flown: number;
} | null {
  const hub = airport(hubIata);
  const dest = airport(destIata);
  if (!hub || !dest) return null;
  const direct = haversineKm(hub.lat, hub.lng, dest.lat, dest.lng);
  const stop = stopoverIata ? airport(stopoverIata) : undefined;
  if (!stopoverIata) return { direct, flown: direct };
  if (!stop) return null;
  const flown =
    haversineKm(hub.lat, hub.lng, stop.lat, stop.lng) +
    haversineKm(stop.lat, stop.lng, dest.lat, dest.lng);
  return { direct, flown };
}

export function runwayOk(mode: GameMode, aircraftRwy: number, airportRwy: number): boolean {
  return mode === "easy" || airportRwy >= aircraftRwy;
}
