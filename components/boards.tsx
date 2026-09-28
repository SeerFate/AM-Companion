"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AircraftPicker, AirportPicker, Field, NumberField, Stat } from "@/components/fields";
import {
  configureCargo,
  configurePax,
  flightHours,
  fuelLbs,
  hoursLabel,
  kmLabel,
  loadFactor,
  money,
  optimalCargo,
  optimalPax,
  paxRevenue,
} from "@/lib/am4";
import { guideSections } from "@/lib/handbook";
import { plane, routeDistance, type Aircraft } from "@/lib/catalog";
import { newId, useAirline, type SavedRoute } from "@/lib/store";

export function Overview() {
  const { airline, patch, setAirline } = useAirline();
  const fuelHint =
    airline.fuelPrice <= 400
      ? "This is a buy. A large tank should be filling here."
      : airline.fuelPrice <= 500
        ? "Good for a tank that holds more than a day of flying."
        : airline.fuelPrice < 1000
          ? "Acceptable if the tank is small. Wait if you can."
          : "Expensive. Only buy what you need before the next price tick.";
  const co2Hint =
    airline.co2Price < 120
      ? "Cheap. Stock quotas."
      : airline.co2Price <= 150
        ? "Ordinary. Do not let the tank hit zero."
        : "Pricey. Buy the minimum that keeps you out of the negative.";

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-card/70 p-5">
          <h2 className="font-heading text-2xl">Airline</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Saved on this device. Reputation starts at 49% in the guide, so a new airline fills about half the seats until marketing is running. The installed Android app keeps working with no connection. Move a copy to another device with Export JSON and Import JSON.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={airline.name} onChange={(event) => patch({ name: event.target.value })} />
            </Field>
            <Field label="Game mode">
              <select
                className="h-8 rounded-lg border bg-transparent px-2 text-sm"
                value={airline.mode}
                onChange={(event) => patch({ mode: event.target.value as "easy" | "realism" })}
              >
                <option value="easy">Easy</option>
                <option value="realism">Realism</option>
              </select>
            </Field>
            <NumberField label="Reputation %" value={airline.reputation} onChange={(reputation) => patch({ reputation })} />
            <NumberField label="Fuel $ / 1,000 lbs" value={airline.fuelPrice} onChange={(fuelPrice) => patch({ fuelPrice })} />
            <NumberField label="CO2 $ / 1,000 quotas" value={airline.co2Price} onChange={(co2Price) => patch({ co2Price })} />
            <NumberField label="Fuel training" value={airline.fuelTraining} onChange={(fuelTraining) => patch({ fuelTraining })} />
            <NumberField label="CO2 training" value={airline.co2Training} onChange={(co2Training) => patch({ co2Training })} />
            <NumberField label="Repair training" value={airline.repairTraining} onChange={(repairTraining) => patch({ repairTraining })} />
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Stat label="Fleet" value={String(airline.planes.length)} />
          <Stat label="Routes" value={String(airline.routes.length)} />
          <Stat label="Expected fill" value={`${Math.round(loadFactor(airline.reputation) * 100)}%`} />
          <div className="rounded-xl border bg-card/80 px-3 py-3 text-sm">
            <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Fuel</div>
            <p className="mt-1">{fuelHint}</p>
            <div className="mt-3 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">CO2</div>
            <p className="mt-1">{co2Hint}</p>
          </div>
        </div>
      </section>
      <Backup onReplace={setAirline} snapshot={airline} />
    </div>
  );
}

function Backup({
  snapshot,
  onReplace,
}: {
  snapshot: ReturnType<typeof useAirline>["airline"];
  onReplace: (next: ReturnType<typeof useAirline>["airline"]) => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <section className="rounded-2xl border bg-card/70 p-5">
      <h2 className="font-heading text-xl">Backup</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your old spreadsheet was not in this project. Export this desk, or import a JSON backup later. A spreadsheet can be folded in once you add the file.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "am4-desk.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text());
                if (!parsed || !Array.isArray(parsed.planes) || !Array.isArray(parsed.routes)) {
                  setMessage("That file is not an AM4 desk backup.");
                  return;
                }
                onReplace(parsed);
                setMessage("Backup loaded.");
              } catch {
                setMessage("Could not read that file.");
              }
            }}
          />
          <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border px-3 text-sm">Import JSON</span>
        </label>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
}

export function Handbook() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const sections = guideSections.filter((section) => {
    if (!q) return true;
    const blob = JSON.stringify(section).toLowerCase();
    return blob.includes(q);
  });

  return (
    <div className="grid gap-4">
      <Input
        value={query}
        placeholder="Search the guide: stopover, reputation, An-225, salary…"
        onChange={(event) => setQuery(event.target.value)}
      />
      {sections.map((section) => (
        <article key={section.id} id={section.id} className="rounded-2xl border bg-card/75 p-5">
          <h2 className="font-heading text-2xl">{section.title}</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6">
            {section.blocks.map((block, index) => {
              if (block.kind === "p") return <p key={index}>{block.text}</p>;
              if (block.kind === "list") {
                return (
                  <ul key={index} className="grid list-disc gap-1 pl-5">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <div key={index} className="rounded-xl border border-primary/30 bg-primary/8 px-3 py-2">
                  <div className="text-[11px] tracking-[0.16em] text-primary uppercase">{block.label}</div>
                  <p className="mt-1 font-mono text-[13px] leading-5">{block.text}</p>
                </div>
              );
            })}
          </div>
        </article>
      ))}
      {sections.length === 0 && <p className="text-sm text-muted-foreground">Nothing in the guide matches that.</p>}
    </div>
  );
}

export function FleetBoard() {
  const { airline, patch } = useAirline();
  const [registration, setRegistration] = useState("");
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<Aircraft | null>(null);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border bg-card/75 p-5">
        <h2 className="font-heading text-2xl">Add a plane</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <AircraftPicker label="Aircraft" onPick={setPicked} />
          <Field label="Registration">
            <Input value={registration} placeholder="N-1001" onChange={(event) => setRegistration(event.target.value)} />
          </Field>
          <Field label="Notes">
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </div>
        {picked && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {picked.name} · {picked.engine} · range {picked.range.toLocaleString()} km · runway {picked.rwy.toLocaleString()} ft · A-check {picked.maint} h
          </p>
        )}
        <Button
          className="mt-4 min-h-11 md:min-h-8"
          type="button"
          disabled={!picked}
          onClick={() => {
            if (!picked) return;
            patch({
              planes: [
                ...airline.planes,
                {
                  id: newId(),
                  aircraftId: picked.id,
                  registration: registration || picked.short.toUpperCase(),
                  routeId: null,
                  notes,
                },
              ],
            });
            setRegistration("");
            setNotes("");
          }}
        >
          Add to fleet
        </Button>
      </section>
      <div className="grid gap-3 md:hidden">
        {airline.planes.map((owned) => {
          const spec = plane(owned.aircraftId);
          return (
            <article key={owned.id} className="rounded-2xl border bg-card/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-lg text-primary">{owned.registration}</div>
                  <p className="text-sm">{spec ? `${spec.name} · ${spec.engine}` : "Unknown type"}</p>
                  {owned.notes && <p className="text-xs text-muted-foreground">{owned.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  type="button"
                  onClick={() => patch({ planes: airline.planes.filter((item) => item.id !== owned.id) })}
                >
                  Remove
                </Button>
              </div>
              <label className="mt-3 grid gap-1.5 text-sm">
                <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Route</span>
                <select
                  className="w-full rounded-lg border bg-transparent px-2"
                  value={owned.routeId ?? ""}
                  onChange={(event) =>
                    patch({
                      planes: airline.planes.map((item) =>
                        item.id === owned.id ? { ...item, routeId: event.target.value || null } : item,
                      ),
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {airline.routes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.hub}-{item.dest}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          );
        })}
        {airline.planes.length === 0 && (
          <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No aircraft yet. Start with a DC-9-10 or BAe 146-300 if you are following the guide.
          </p>
        )}
      </div>
      <div className="hidden overflow-auto rounded-2xl border md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2">Registration</th>
              <th className="px-3 py-2">Aircraft</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {airline.planes.map((owned) => {
              const spec = plane(owned.aircraftId);
              const route = airline.routes.find((item) => item.id === owned.routeId);
              return (
                <tr key={owned.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{owned.registration}</td>
                  <td className="px-3 py-2">
                    {spec ? `${spec.name} · ${spec.engine}` : "Unknown type"}
                    {owned.notes && <div className="text-xs text-muted-foreground">{owned.notes}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 max-w-56 rounded-lg border bg-transparent px-2"
                      value={owned.routeId ?? ""}
                      onChange={(event) =>
                        patch({
                          planes: airline.planes.map((item) =>
                            item.id === owned.id ? { ...item, routeId: event.target.value || null } : item,
                          ),
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {airline.routes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.hub}-{item.dest}
                        </option>
                      ))}
                    </select>
                    {route && <div className="mt-1 text-xs text-muted-foreground">{route.kind}</div>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => patch({ planes: airline.planes.filter((item) => item.id !== owned.id) })}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
            {airline.planes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No aircraft yet. Start with a DC-9-10 or BAe 146-300 if you are following the guide.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RouteBoard() {
  const { airline, patch } = useAirline();
  const [draft, setDraft] = useState<Omit<SavedRoute, "id">>({
    kind: "pax",
    hub: "",
    dest: "",
    stopover: "",
    demandY: 0,
    demandJ: 0,
    demandF: 0,
    demandL: 0,
    demandH: 0,
    notes: "",
  });

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border bg-card/75 p-5">
        <h2 className="font-heading text-2xl">Log a route</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type the daily demand from the game. Fares use the straight-line distance. A stopover only changes flight time and fuel.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Kind">
            <select
              className="h-8 rounded-lg border bg-transparent px-2 text-sm"
              value={draft.kind}
              onChange={(event) => setDraft({ ...draft, kind: event.target.value as "pax" | "cargo" })}
            >
              <option value="pax">Passenger</option>
              <option value="cargo">Cargo</option>
            </select>
          </Field>
          <AirportPicker label="Hub" value={draft.hub} onChange={(hub) => setDraft({ ...draft, hub })} />
          <AirportPicker label="Destination" value={draft.dest} onChange={(dest) => setDraft({ ...draft, dest })} />
          <AirportPicker label="Stopover, optional" value={draft.stopover} onChange={(stopover) => setDraft({ ...draft, stopover })} />
          {draft.kind === "pax" ? (
            <>
              <NumberField label="Economy demand" value={draft.demandY} onChange={(demandY) => setDraft({ ...draft, demandY })} />
              <NumberField label="Business demand" value={draft.demandJ} onChange={(demandJ) => setDraft({ ...draft, demandJ })} />
              <NumberField label="First demand" value={draft.demandF} onChange={(demandF) => setDraft({ ...draft, demandF })} />
            </>
          ) : (
            <>
              <NumberField label="Large demand, lbs" value={draft.demandL} onChange={(demandL) => setDraft({ ...draft, demandL })} />
              <NumberField label="Heavy demand, lbs" value={draft.demandH} onChange={(demandH) => setDraft({ ...draft, demandH })} />
            </>
          )}
        </div>
        <Field label="Notes">
          <Textarea className="mt-3" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </Field>
        <Button
          className="mt-4"
          type="button"
          disabled={!draft.hub || !draft.dest}
          onClick={() => {
            patch({ routes: [...airline.routes, { ...draft, id: newId() }] });
            setDraft({ ...draft, dest: "", stopover: "", notes: "" });
          }}
        >
          Save route
        </Button>
      </section>
      <div className="grid gap-3">
        {airline.routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
        {airline.routes.length === 0 && (
          <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No routes logged. Use Research to find a flight that fits the hours you can depart, then log it with its demand.
          </p>
        )}
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: SavedRoute }) {
  const { airline, patch } = useAirline();
  const distance = routeDistance(route.hub, route.dest, route.stopover);
  const assigned = airline.planes.filter((item) => item.routeId === route.id);
  const update = (partial: Partial<SavedRoute>) =>
    patch({ routes: airline.routes.map((item) => (item.id === route.id ? { ...item, ...partial } : item)) });
  const planned = route.aircraftId != null ? plane(route.aircraftId) : undefined;
  const spec = planned ?? assigned.map((item) => plane(item.aircraftId)).find(Boolean);
  const copies = route.copies && route.copies > 0 ? route.copies : Math.max(1, assigned.length);
  const fill = loadFactor(airline.reputation);
  const direct = distance?.direct ?? 0;
  const flown = distance?.flown ?? 0;

  const plan = useMemo(() => {
    if (!spec || !distance) return null;
    const ci = route.costIndex ?? 200;
    const slot = flightHours(flown, spec.speed, airline.mode, ci);
    const tripsEach = route.trips && route.trips > 0 ? route.trips : Math.max(1, Math.floor(24 / Math.max(slot, 0.01)));
    const flights = tripsEach * copies;
    if (route.kind === "pax") {
      const prices = optimalPax(direct, airline.mode);
      const config = configurePax({
        capacity: spec.capacity,
        demand: { y: route.demandY, j: route.demandJ, f: route.demandF },
        flightsPerDay: flights,
        distanceKm: direct,
        mode: airline.mode,
      });
      const fuel = fuelLbs({
        consumption: spec.fuel,
        distanceKm: flown,
        ci,
        fuelTraining: airline.fuelTraining,
      });
      const income = paxRevenue(config.seats, prices, fill);
      return { flights, tripsEach, prices, config, fuel, income, slot, ci };
    }
    const prices = optimalCargo(direct, airline.mode);
    const config = configureCargo({
      capacityLbs: spec.capacity,
      largeDemand: route.demandL,
      heavyDemand: route.demandH,
        flightsPerDay: flights,
      distanceKm: direct,
      mode: airline.mode,
    });
    const fuel = fuelLbs({
      consumption: spec.fuel,
      distanceKm: flown,
      ci,
      fuelTraining: airline.fuelTraining,
    });
    return { flights, tripsEach, prices, config, fuel, income: 0, slot, ci };
  }, [airline, copies, direct, distance, fill, flown, route, spec]);

  return (
    <article className="rounded-2xl border bg-card/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl">
            {route.hub} → {route.dest}
            {route.stopover ? ` via ${route.stopover}` : ""}
          </h3>
          <p className="font-mono text-xs text-muted-foreground">
            {distance ? `${kmLabel(direct)} direct · ${kmLabel(flown)} flown` : "Airport codes not in the catalog"} · {route.kind}
            {spec ? ` · ${copies} × ${spec.name}` : ` · ${assigned.length} aircraft`}
          </p>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={() =>
            patch({
              routes: airline.routes.filter((item) => item.id !== route.id),
              planes: airline.planes.map((item) => (item.routeId === route.id ? { ...item, routeId: null } : item)),
            })
          }
        >
          Delete
        </Button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {route.kind === "pax" ? (
          <>
            <NumberField
              label="Economy / day"
              value={route.demandY}
              onChange={(demandY) => update({ demandY })}
              onBlur={() => {
                if (!route.baseY || route.baseY <= 0) return;
                const factor = route.demandY / route.baseY;
                const demandJ = Math.round((route.baseJ ?? 0) * factor);
                const demandF = Math.round((route.baseF ?? 0) * factor);
                update({ demandJ, demandF, demandL: route.demandY * 500, demandH: demandJ * 1000 });
              }}
            />
            <NumberField label="Business / day" value={route.demandJ} onChange={(demandJ) => update({ demandJ })} />
            <NumberField label="First / day" value={route.demandF} onChange={(demandF) => update({ demandF })} />
          </>
        ) : (
          <>
            <NumberField label="Large lbs / day" value={route.demandL} onChange={(demandL) => update({ demandL })} />
            <NumberField label="Heavy lbs / day" value={route.demandH} onChange={(demandH) => update({ demandH })} />
          </>
        )}
      </div>
      {route.baseY != null && route.baseY > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Table demand is {route.baseY.toLocaleString("en-US")} / {(route.baseJ ?? 0).toLocaleString("en-US")} /{" "}
          {(route.baseF ?? 0).toLocaleString("en-US")}. Leaving the economy field sets business and first from that same
          percent.
        </p>
      )}
      {!spec && <p className="mt-3 text-sm text-muted-foreground">Assign a plane on the Fleet board to calculate seats.</p>}
      {plan && route.kind === "pax" && "seats" in plan.config && "y" in plan.prices && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Seats Y / J / F" value={`${plan.config.seats.y} / ${plan.config.seats.j} / ${plan.config.seats.f}`} />
          <Stat label="Fares" value={`${money(plan.prices.y)} / ${money(plan.prices.j)} / ${money(plan.prices.f)}`} />
          <Stat label="Income / departure" value={money(plan.income)} />
          <Stat label="Fuel / departure" value={`${Math.round(plan.fuel).toLocaleString()} lbs`} />
        </div>
      )}
      {plan && route.kind === "cargo" && "mix" in plan.config && "large" in plan.prices && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Large / heavy" value={`${plan.config.mix.large.toFixed(1)}% / ${plan.config.mix.heavy.toFixed(1)}%`} />
          <Stat label="Fares / lb" value={`${money(plan.prices.large)} / ${money(plan.prices.heavy)}`} />
          <Stat label="Fuel / departure" value={`${Math.round(plan.fuel).toLocaleString()} lbs`} />
        </div>
      )}
      {plan && (
        <p className="mt-2 text-xs text-muted-foreground">
          Block {hoursLabel(plan.slot)} at cost index {plan.ci}. {copies} {copies === 1 ? "plane" : "planes"} × {plan.tripsEach}{" "}
          {plan.tripsEach === 1 ? "trip" : "trips"} is {plan.flights} departures sharing one demand pool. Order:{" "}
          {"order" in plan.config ? plan.config.order.join(" > ").toUpperCase() : plan.config.preferLarge ? "large first" : "heavy first"}.
          {plan.config && "unused" in plan.config && plan.config.unused > 0
            ? ` ${plan.config.unused} economy-sized spaces left empty so you do not fly unsold seats.`
            : ""}
        </p>
      )}
    </article>
  );
}
