import { routePairIndex } from "@/lib/am4";
import { airports } from "@/lib/catalog";

export const AIRPORT_COUNT = airports.length;

const PAIR_COUNT = (AIRPORT_COUNT * (AIRPORT_COUNT - 1)) / 2;
const icaoIndex = new Map(airports.map((item, index) => [item.icao, index]));

export type RouteDemand = {
  y: number;
  j: number;
  f: number;
  large: number;
  heavy: number;
};

export function scalePax(raw: { y: number; j: number; f: number }, scale: number): RouteDemand {
  const factor = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const y = Math.max(0, Math.round(raw.y * factor));
  const j = Math.max(0, Math.round(raw.j * factor));
  const f = Math.max(0, Math.round(raw.f * factor));
  return { y, j, f, large: y * 500, heavy: j * 1000 };
}

export function demandOf(table: Uint16Array, icaoA: string, icaoB: string): RouteDemand | null {
  const a = icaoIndex.get(icaoA);
  const b = icaoIndex.get(icaoB);
  if (a === undefined || b === undefined || a === b) return null;
  const offset = routePairIndex(a, b, AIRPORT_COUNT) * 3;
  const y = table[offset] ?? 0;
  const j = table[offset + 1] ?? 0;
  const f = table[offset + 2] ?? 0;
  return { y, j, f, large: y * 500, heavy: j * 1000 };
}

async function fetchDemandBytes(): Promise<ArrayBuffer> {
  const gzipped = await fetch("/demands.bin.gz");
  if (gzipped.ok) {
    const buf = await gzipped.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).arrayBuffer();
    }
    return buf;
  }
  const raw = await fetch("/demands.bin");
  if (!raw.ok) throw new Error(String(raw.status));
  return raw.arrayBuffer();
}

let pending: Promise<Uint16Array> | null = null;

/** Published daily demand for every undirected city pair, little-endian y, j, f. */
export function loadRouteDemand(): Promise<Uint16Array> {
  if (!pending) {
    const run = fetchDemandBytes().then((raw) => {
      const table = new Uint16Array(raw);
      if (table.length !== PAIR_COUNT * 3) {
        throw new Error(`expected ${PAIR_COUNT * 3} values, got ${table.length}`);
      }
      return table;
    });
    pending = run;
    run.catch(() => {
      if (pending === run) pending = null;
    });
  }
  return pending;
}
