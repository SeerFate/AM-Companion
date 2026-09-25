"use client";

import { useState } from "react";
import { FleetBoard, Handbook, Overview, RouteBoard, ScheduleBoard } from "@/components/boards";
import { useAirline } from "@/lib/store";

const TABS = [
  ["desk", "Desk"],
  ["schedule", "Schedule"],
  ["routes", "Routes"],
  ["fleet", "Fleet"],
  ["guide", "Guide"],
] as const;

export function Companion() {
  const { airline, ready } = useAirline();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("desk");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 pb-28 md:px-8 md:py-6 md:pb-6">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.22em] text-primary uppercase">Airline Manager 4</p>
          <h1 className="font-heading text-3xl leading-none break-words md:text-5xl">{airline.name}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A personal desk for the routes you fly, the planes on them, and the fares and departure slots that keep them earning.
          </p>
        </div>
        <nav className="hidden flex-wrap gap-1 md:flex">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pt-1 backdrop-blur-md md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`min-h-12 rounded-lg text-xs ${tab === id ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
      <main className="py-6">
        {!ready ? (
          <p className="text-sm text-muted-foreground">Opening the desk…</p>
        ) : (
          <>
            {tab === "desk" && <Overview />}
            {tab === "schedule" && <ScheduleBoard />}
            {tab === "routes" && <RouteBoard />}
            {tab === "fleet" && <FleetBoard />}
            {tab === "guide" && <Handbook />}
          </>
        )}
      </main>
    </div>
  );
}
