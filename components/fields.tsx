"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  airport,
  searchAircraft,
  searchAirports,
  type Aircraft,
  type Airport,
} from "@/lib/catalog";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}

export function AirportPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iata: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const hits = searchAirports(query);

  useEffect(() => setQuery(value), [value]);

  return (
    <Field label={label}>
      <div className="relative">
        <Input
          value={query}
          aria-controls={listId}
          aria-expanded={open}
          placeholder="IATA, city, or country"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            const exact = airport(next.trim());
            onChange(exact ? exact.iata : "");
          }}
          onFocus={() => setOpen(true)}
        />
        {open && hits.length > 0 && (
          <ul
            id={listId}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
          >
            {hits.map((hit) => (
              <li key={hit.iata}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange(hit.iata);
                    setQuery(`${hit.iata} · ${hit.name}`);
                    setOpen(false);
                  }}
                >
                  <span>
                    <span className="font-mono text-primary">{hit.iata}</span> {hit.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{hit.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

export function AircraftPicker({
  label,
  kind,
  onPick,
}: {
  label: string;
  kind?: Aircraft["type"];
  onPick: (aircraft: Aircraft) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const hits = searchAircraft(query, kind);

  return (
    <Field label={label}>
      <div className="relative">
        <Input
          value={query}
          placeholder="A380, DC-9, 747-8F…"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && hits.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onPick(hit);
                    setQuery(`${hit.name} · ${hit.engine}`);
                    setOpen(false);
                  }}
                >
                  <span>
                    {hit.name}{" "}
                    <span className="text-muted-foreground">{hit.engine}</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {hit.type} · {hit.capacity.toLocaleString()} · {Math.round(hit.speed)} km/h ·{" "}
                    {hit.range.toLocaleString()} km
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

export function airportLine(airport: Airport | undefined, iata: string): string {
  if (!airport) return iata || "—";
  return `${airport.iata} · ${airport.name}`;
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/80 px-3 py-2">
      <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</div>
      <div className="font-mono text-base break-words text-primary md:text-lg">{value}</div>
    </div>
  );
}
