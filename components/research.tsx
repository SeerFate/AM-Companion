"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { AircraftPicker, AirportPicker, Field, NumberField, Stat } from "@/components/fields";
import { Input } from "@/components/ui/input";
import {
  configureCargo,
  configurePax,
  fuelLbs,
  hoursLabel,
  haversineKm,
  kmLabel,
  loadFactor,
  money,
  optimalCargo,
  optimalPax,
  paxRevenue,
  recommendCi,
  type Cabin,
  type GameMode,
} from "@/lib/am4";
import {
  airport,
  airports,
  engineVariants,
  plane,
  runwayOk,
  type Aircraft,
  type Airport,
} from "@/lib/catalog";
import { demandOf, loadRouteDemand, scalePax } from "@/lib/demand";
import { newId, useAirline } from "@/lib/store";

const BLOCK_WINDOW_HOURS = 0.75;
const FILL_FLOOR = 0.9;
const MAX_ROWS = 80;
const selectClass = "h-8 w-full rounded-lg border bg-transparent px-2 text-sm";

const CABIN_NAME: Record<Cabin, string> = {
  y: "economy",
  j: "business",
  f: "first",
};

type Match = {
  dest: Airport;
  direct: number;
  ci: number;
  hours: number;
  rawY: number;
  rawJ: number;
  rawF: number;
  y: number;
  j: number;
  f: number;
  large: number;
  heavy: number;
  fill: number;
  fuel: number;
  seats: { y: number; j: number; f: number } | null;
  order: Cabin[] | null;
  unused: number;
  mix: { large: number; heavy: number } | null;
  preferLarge: boolean;
};

function cargoCovered(
  capacityLbs: number,
  largeDemand: number,
  heavyDemand: number,
  trips: number,
  distanceKm: number,
  mode: GameMode,
): number {
  const flights = Math.max(1, trips);
  const preferLarge = mode === "realism" || distanceKm < 23908;
  if (preferLarge) {
    const hold = capacityLbs * 0.7;
    return hold === 0 ? 0 : Math.min(1, largeDemand / flights / hold);
  }
  return capacityLbs === 0 ? 0 : Math.min(1, heavyDemand / flights / capacityLbs);
}

export function ResearchBoard() {
  const { airline, patch } = useAirline();
  const [hub, setHub] = useState("");
  const [picked, setPicked] = useState<Aircraft | null>(null);
  const [blockHours, setBlockHours] = useState(8);
  const [trips, setTrips] = useState(2);
  const [copies, setCopies] = useState(1);
  const [minCi, setMinCi] = useState(0);
  const [optimalCi, setOptimalCi] = useState(200);
  const [aroundCi, setAroundCi] = useState(15);
  const [aroundOn, setAroundOn] = useState(false);
  const [onlyRunway, setOnlyRunway] = useState(true);
  const [onlyFull, setOnlyFull] = useState(true);
  const [chosen, setChosen] = useState("");
  const [table, setTable] = useState<Uint16Array | null>(null);
  const [demandError, setDemandError] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const shouldScroll = useRef(false);

  useEffect(() => {
    let live = true;
    loadRouteDemand()
      .then((value) => {
        if (live) setTable(value);
      })
      .catch(() => {
        if (live) setDemandError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const variants = useMemo(
    () => (picked ? engineVariants(picked.type, picked.name) : []),
    [picked],
  );

  const target = Number.isFinite(blockHours) && blockHours > 0 ? blockHours : 8;
  const perDay = Number.isFinite(trips) && trips >= 1 ? Math.floor(trips) : 1;
  const copyCount = Number.isFinite(copies) && copies >= 1 ? Math.floor(copies) : 1;
  const departures = perDay * copyCount;
  const scale = airline.demandScale > 0 ? airline.demandScale : 1;

  const result = useMemo(() => {
    if (!picked || !hub || !table) return { rows: [] as Match[], total: 0, hubShort: false };
    const origin = airport(hub);
    if (!origin) return { rows: [] as Match[], total: 0, hubShort: false };
    const hubShort = airline.mode === "realism" && !runwayOk(airline.mode, picked.rwy, origin.rwy);
    if (hubShort) return { rows: [] as Match[], total: 0, hubShort: true };
    const cargo = picked.type === "cargo";
    const rows: Match[] = [];
    for (const dest of airports) {
      if (dest.icao === origin.icao) continue;
      const direct = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
      if (direct < 100 || direct > picked.range) continue;
      if (onlyRunway && !runwayOk(airline.mode, picked.rwy, dest.rwy)) continue;
      const slot = recommendCi({
        distanceKm: direct,
        baseSpeed: picked.speed,
        mode: airline.mode,
        slotHours: target,
        minCi,
        optimalCi,
        around: aroundOn ? aroundCi : null,
        windowHours: BLOCK_WINDOW_HOURS,
      });
      if (!slot) continue;
      const raw = demandOf(table, origin.icao, dest.icao);
      if (!raw) continue;
      const demand = scalePax(raw, scale);
      const fuel = fuelLbs({
        consumption: picked.fuel,
        distanceKm: direct,
        ci: slot.ci,
        fuelTraining: airline.fuelTraining,
      });
      if (cargo) {
        const config = configureCargo({
          capacityLbs: picked.capacity,
          largeDemand: demand.large,
          heavyDemand: demand.heavy,
          flightsPerDay: departures,
          distanceKm: direct,
          mode: airline.mode,
        });
        const fill = cargoCovered(picked.capacity, demand.large, demand.heavy, departures, direct, airline.mode);
        if (onlyFull && fill < FILL_FLOOR) continue;
        rows.push({
          dest,
          direct,
          ci: slot.ci,
          hours: slot.hours,
          rawY: raw.y,
          rawJ: raw.j,
          rawF: raw.f,
          y: demand.y,
          j: demand.j,
          f: demand.f,
          large: demand.large,
          heavy: demand.heavy,
          fill,
          fuel,
          seats: null,
          order: null,
          unused: 0,
          mix: config.mix,
          preferLarge: config.preferLarge,
        });
        continue;
      }
      const config = configurePax({
        capacity: picked.capacity,
        demand,
        flightsPerDay: departures,
        distanceKm: direct,
        mode: airline.mode,
      });
      const fill = picked.capacity === 0 ? 0 : (picked.capacity - config.unused) / picked.capacity;
      if (onlyFull && fill < FILL_FLOOR) continue;
      rows.push({
        dest,
        direct,
        ci: slot.ci,
        hours: slot.hours,
        rawY: raw.y,
        rawJ: raw.j,
        rawF: raw.f,
        y: demand.y,
        j: demand.j,
        f: demand.f,
        large: demand.large,
        heavy: demand.heavy,
        fill,
        fuel,
        seats: config.seats,
        order: config.order,
        unused: config.unused,
        mix: null,
        preferLarge: false,
      });
    }
    const score = (row: Match) => (cargo ? row.large + row.heavy : row.y + row.j * 2 + row.f * 3);
    rows.sort((a, b) => score(b) - score(a) || b.hours - a.hours);
    return { rows: rows.slice(0, MAX_ROWS), total: rows.length, hubShort: false };
  }, [airline.demandScale, airline.fuelTraining, airline.mode, aroundCi, aroundOn, copyCount, departures, hub, minCi, onlyFull, onlyRunway, optimalCi, perDay, picked, scale, table, target]);

  const selected = result.rows.find((row) => row.dest.icao === chosen) ?? result.rows[0] ?? null;

  useEffect(() => {
    if (!shouldScroll.current) return;
    shouldScroll.current = false;
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [chosen]);

  const choose = (icao: string) => {
    shouldScroll.current = true;
    setChosen(icao);
  };

  const logRoute = (row: Match, demand = { y: row.y, j: row.j, f: row.f, large: row.large, heavy: row.heavy }) => {
    if (!picked) return;
    patch({
      routes: [
        ...airline.routes,
        {
          id: newId(),
          kind: picked.type === "cargo" ? "cargo" : "pax",
          hub,
          dest: row.dest.iata,
          stopover: "",
          demandY: demand.y,
          demandJ: demand.j,
          demandF: demand.f,
          demandL: demand.large,
          demandH: demand.heavy,
          baseY: row.rawY,
          baseJ: row.rawJ,
          baseF: row.rawF,
          aircraftId: picked.id,
          copies: copyCount,
          trips: perDay,
          costIndex: row.ci,
          notes: "",
        },
      ],
    });
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border bg-card/75 p-5">
        <h2 className="font-heading text-2xl">Research</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pick a hub, an airplane, and its engine. The list is direct routes that finish within 45 minutes of the block
          time, at or above the minimum cost index. Around the optimal index keeps the setting near that number instead
          of slowing the flight all the way down. Open a route for ticket prices, the seat layout, and the index to enter.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <AirportPicker label="Hub" value={hub} onChange={setHub} />
          <AircraftPicker label="Airplane" onPick={setPicked} />
          <Field label="Engine">
            <select
              className={selectClass}
              value={picked ? String(picked.id) : ""}
              disabled={!picked}
              onChange={(event) => {
                const next = plane(Number(event.target.value));
                if (next) setPicked(next);
              }}
            >
              {!picked && <option value="">Choose an airplane</option>}
              {variants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.engine} · {Math.round(item.speed)} km/h · {item.fuel} lb/km
                </option>
              ))}
            </select>
          </Field>
          <NumberField label="Block time, hours" value={blockHours} step={0.5} min={1} onChange={setBlockHours} />
          <NumberField label="Trips per day" value={trips} min={1} onChange={setTrips} />
          <NumberField label="Planes on this route" value={copies} min={1} onChange={setCopies} />
          <NumberField label="Minimum cost index" value={minCi} min={0} onChange={setMinCi} />
          <NumberField label="Optimal cost index" value={optimalCi} min={0} onChange={setOptimalCi} />
          <NumberField label="Around optimal, ±" value={aroundCi} min={0} onChange={setAroundCi} />
          <NumberField
            label="Demand adjustment %"
            value={Math.round((scale - 1) * 1000) / 10}
            step={0.1}
            min={-80}
            onChange={(percent) => {
              if (!Number.isFinite(percent)) return;
              patch({ demandScale: 1 + percent / 100 });
            }}
          />
        </div>
        <div className="mt-3 grid gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyRunway} onChange={(event) => setOnlyRunway(event.target.checked)} />
            Hide destinations whose runway is too short for realism
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyFull} onChange={(event) => setOnlyFull(event.target.checked)} />
            Only routes that fill at least 90% of the cabin on every departure
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aroundOn} onChange={(event) => setAroundOn(event.target.checked)} />
            Keep the cost index around the optimal one
          </label>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {copyCount} {copyCount === 1 ? "plane" : "planes"} × {perDay} {perDay === 1 ? "trip" : "trips"} is {departures}{" "}
          {departures === 1 ? "departure" : "departures"}, about {hoursLabel(target * perDay)} in the air for each plane.
          {scale !== 1 ? ` Demand is ${scale > 1 ? "+" : ""}${((scale - 1) * 100).toFixed(1)}% versus the table.` : ""}
          {picked
            ? ` ${picked.name} · ${picked.engine} · range ${kmLabel(picked.range)} · runway ${picked.rwy.toLocaleString()} ft · ${picked.capacity.toLocaleString()} ${picked.type === "cargo" ? "lbs" : "seats"}.`
            : ""}
        </p>
      </section>

      {selected && picked && (
        <RouteDetail
          panelRef={detailRef}
          hub={hub}
          picked={picked}
          row={selected}
          trips={perDay}
          copies={copyCount}
          target={target}
          reputation={airline.reputation}
          mode={airline.mode}
          onApplyScale={(next) => patch({ demandScale: next })}
          onLog={(demand) => logRoute(selected, demand)}
        />
      )}

      <ResearchList
        rows={result.rows}
        total={result.total}
        cargo={picked?.type === "cargo"}
        selectedIcao={selected?.dest.icao ?? ""}
        ready={Boolean(picked && hub)}
        loading={!table && !demandError}
        error={demandError}
        hubShort={result.hubShort}
        onChoose={choose}
      />
    </div>
  );
}

function ResearchList({
  rows,
  total,
  cargo,
  selectedIcao,
  ready,
  loading,
  error,
  hubShort,
  onChoose,
}: {
  rows: Match[];
  total: number;
  cargo: boolean;
  selectedIcao: string;
  ready: boolean;
  loading: boolean;
  error: boolean;
  hubShort: boolean;
  onChoose: (icao: string) => void;
}) {
  const empty = emptyMessage({ ready, loading, error, hubShort, count: rows.length });
  return (
    <>
      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {total > rows.length
            ? `${rows.length} of ${total} routes, highest demand first.`
            : `${total} ${total === 1 ? "route" : "routes"}, highest demand first.`}
        </p>
      )}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.dest.icao}
            className={`rounded-2xl border p-4 ${row.dest.icao === selectedIcao ? "border-primary bg-primary/10" : "bg-card/80"}`}
          >
            <button type="button" className="w-full text-left" onClick={() => onChoose(row.dest.icao)}>
              <div className="font-mono text-lg text-primary">
                {row.dest.iata} <span className="text-sm text-muted-foreground">{row.dest.icao}</span>
              </div>
              <p className="text-sm">
                {row.dest.name}, {row.dest.country}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Fact label="Distance" value={kmLabel(row.direct)} />
                <Fact label="Block" value={hoursLabel(row.hours)} />
                <Fact label="Cost index" value={String(row.ci)} />
                <Fact label="Demand" value={demandText(row, cargo)} />
              </dl>
            </button>
          </article>
        ))}
        {empty && <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>}
      </div>
      <div className="hidden overflow-auto rounded-2xl border md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Distance</th>
              <th className="px-3 py-2">Block</th>
              <th className="px-3 py-2">CI</th>
              <th className="px-3 py-2">{cargo ? "Large / heavy" : "Demand Y / J / F"}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.dest.icao}
                className={`cursor-pointer border-t ${row.dest.icao === selectedIcao ? "bg-primary/10" : "hover:bg-accent/50"}`}
                onClick={() => onChoose(row.dest.icao)}
              >
                <td className="px-3 py-2">
                  <div className="font-mono text-primary">
                    {row.dest.iata} <span className="text-xs text-muted-foreground">{row.dest.icao}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.dest.name}, {row.dest.country}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono">{kmLabel(row.direct)}</td>
                <td className="px-3 py-2 font-mono">{hoursLabel(row.hours)}</td>
                <td className="px-3 py-2 font-mono">{row.ci}</td>
                <td className="px-3 py-2 font-mono text-xs">{demandText(row, cargo)}</td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={row.dest.icao === selectedIcao ? "default" : "secondary"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onChoose(row.dest.icao);
                    }}
                  >
                    Open
                  </Button>
                </td>
              </tr>
            ))}
            {empty && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function emptyMessage({
  ready,
  loading,
  error,
  hubShort,
  count,
}: {
  ready: boolean;
  loading: boolean;
  error: boolean;
  hubShort: boolean;
  count: number;
}): string | null {
  if (count > 0) return null;
  if (!ready) return "Choose a hub and an airplane.";
  if (loading) return "Loading demand for every city pair…";
  if (error) return "The demand table did not load. Refresh and try the search again.";
  if (hubShort) return "This hub runway is shorter than the airplane requires in realism.";
  return "Nothing on this airplane finishes within 45 minutes of that block time, inside the cost-index limits and its range, with enough demand for that many departures. Raise the block time, lower the minimum index, or widen the band around the optimal index.";
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

function demandText(row: Match, cargo: boolean): string {
  if (cargo) {
    return `${Math.round(row.large).toLocaleString("en-US")} / ${Math.round(row.heavy).toLocaleString("en-US")}`;
  }
  return `${row.y.toLocaleString("en-US")} / ${row.j.toLocaleString("en-US")} / ${row.f.toLocaleString("en-US")}`;
}

function RouteDetail({
  panelRef,
  hub,
  picked,
  row,
  trips,
  copies,
  target,
  reputation,
  mode,
  onApplyScale,
  onLog,
}: {
  panelRef: RefObject<HTMLElement | null>;
  hub: string;
  picked: Aircraft;
  row: Match;
  trips: number;
  copies: number;
  target: number;
  reputation: number;
  mode: GameMode;
  onApplyScale: (scale: number) => void;
  onLog: (demand: { y: number; j: number; f: number; large: number; heavy: number }) => void;
}) {
  const origin = airport(hub);
  const cargo = picked.type === "cargo";
  const [gameY, setGameY] = useState("");
  useEffect(() => setGameY(""), [row.dest.icao]);
  const typed = Number(gameY);
  const preview =
    gameY.trim() !== "" && Number.isFinite(typed) && typed >= 0 && row.rawY > 0
      ? scalePax({ y: row.rawY, j: row.rawJ, f: row.rawF }, typed / row.rawY)
      : null;
  const shown = preview ?? { y: row.y, j: row.j, f: row.f, large: row.large, heavy: row.heavy };
  const departures = Math.max(1, trips) * Math.max(1, copies);
  const paxConfig = cargo
    ? null
    : configurePax({
        capacity: picked.capacity,
        demand: shown,
        flightsPerDay: departures,
        distanceKm: row.direct,
        mode,
      });
  const cargoConfig = cargo
    ? configureCargo({
        capacityLbs: picked.capacity,
        largeDemand: shown.large,
        heavyDemand: shown.heavy,
        flightsPerDay: departures,
        distanceKm: row.direct,
        mode,
      })
    : null;
  const gapMinutes = Math.max(0, Math.round((target - row.hours) * 60));
  const prices = cargo ? null : optimalPax(row.direct, mode);
  const cargoPrices = cargo ? optimalCargo(row.direct, mode) : null;
  const income = prices && paxConfig ? paxRevenue(paxConfig.seats, prices, loadFactor(reputation)) : 0;
  const orderText = paxConfig ? paxConfig.order.map((cabin) => CABIN_NAME[cabin]).join(", then ") : "";
  const correction = preview && row.rawY > 0 ? typed / row.rawY : null;

  return (
    <article ref={panelRef} className="scroll-mt-4 rounded-2xl border bg-card/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl">
            {origin?.iata ?? hub} → {row.dest.iata}
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            {origin?.icao ?? hub} → {row.dest.icao} · {row.dest.name}, {row.dest.country} · {kmLabel(row.direct)} ·{" "}
            {hoursLabel(row.hours)}
          </p>
        </div>
        <Button type="button" onClick={() => onLog(shown)}>
          Log route
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
        <Field label="Economy in the game">
          <Input
            type="number"
            min={0}
            value={gameY}
            placeholder={String(row.rawY)}
            onChange={(event) => setGameY(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={correction == null}
            onClick={() => {
              if (correction == null) return;
              onApplyScale(correction);
              setGameY("");
            }}
          >
            Use this correction on other routes
          </Button>
          {correction != null && (
            <p className="text-sm text-muted-foreground">
              {(correction - 1) * 100 >= 0 ? "+" : ""}
              {((correction - 1) * 100).toFixed(1)}% implies business {shown.j.toLocaleString("en-US")} and first{" "}
              {shown.f.toLocaleString("en-US")}.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label={cargo ? "Large / heavy lbs" : "Daily demand Y / J / F"}
          value={
            cargo
              ? `${Math.round(shown.large).toLocaleString("en-US")} / ${Math.round(shown.heavy).toLocaleString("en-US")}`
              : `${shown.y.toLocaleString("en-US")} / ${shown.j.toLocaleString("en-US")} / ${shown.f.toLocaleString("en-US")}`
          }
        />
        {paxConfig ? (
          <Stat label="Layout Y / J / F" value={`${paxConfig.seats.y} / ${paxConfig.seats.j} / ${paxConfig.seats.f}`} />
        ) : cargoConfig ? (
          <Stat
            label="Layout large / heavy"
            value={`${cargoConfig.mix.large.toFixed(0)}% / ${cargoConfig.mix.heavy.toFixed(0)}%`}
          />
        ) : null}
        <Stat
          label={cargo ? "Fares / lb" : "Ticket prices"}
          value={
            prices
              ? `${money(prices.y)} / ${money(prices.j)} / ${money(prices.f)}`
              : cargoPrices
                ? `${money(cargoPrices.large)} / ${money(cargoPrices.heavy)}`
                : "—"
          }
        />
        <Stat label="Cost index" value={String(row.ci)} />
        <Stat label="Fuel / departure" value={`${Math.round(row.fuel).toLocaleString("en-US")} lbs`} />
        {prices && <Stat label="Income / departure" value={money(income)} />}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Set the cost index to {row.ci}. The flight then takes {hoursLabel(row.hours)}
        {gapMinutes <= 1 ? `, on the ${target} hour mark.` : `, ${gapMinutes} minutes under ${target} hours.`}{" "}
        {cargo
          ? `${copies} ${copies === 1 ? "plane makes" : "planes make"} ${trips} ${trips === 1 ? "trip" : "trips"} and use the ${cargoConfig?.preferLarge ? "large" : "heavy"} hold first.`
          : `${copies} ${copies === 1 ? "plane" : "planes"} × ${trips} ${trips === 1 ? "trip" : "trips"} takes ${paxConfig?.seats.y ?? 0} economy, ${paxConfig?.seats.j ?? 0} business, and ${paxConfig?.seats.f ?? 0} first on each departure. Fill ${orderText}.`}
        {paxConfig && paxConfig.unused > 0
          ? ` ${paxConfig.unused} economy-sized spaces stay empty so you do not fly unsold seats.`
          : ""}
        {prices ? ` At ${reputation}% reputation, one departure earns about ${money(income)} before fuel.` : ""}
      </p>
    </article>
  );
}
