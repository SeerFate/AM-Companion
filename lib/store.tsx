"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GameMode } from "@/lib/am4";

export type OwnedPlane = {
  id: string;
  aircraftId: number;
  registration: string;
  routeId: string | null;
  notes: string;
};

export type SavedRoute = {
  id: string;
  kind: "pax" | "cargo";
  hub: string;
  dest: string;
  stopover: string;
  demandY: number;
  demandJ: number;
  demandF: number;
  demandL: number;
  demandH: number;
  notes: string;
};

export type AirlineState = {
  name: string;
  mode: GameMode;
  reputation: number;
  fuelPrice: number;
  co2Price: number;
  fuelTraining: number;
  co2Training: number;
  repairTraining: number;
  planes: OwnedPlane[];
  routes: SavedRoute[];
};

const STORAGE_KEY = "am4-desk-v1";

export const emptyAirline = (): AirlineState => ({
  name: "My airline",
  mode: "easy",
  reputation: 49,
  fuelPrice: 600,
  co2Price: 130,
  fuelTraining: 0,
  co2Training: 0,
  repairTraining: 0,
  planes: [],
  routes: [],
});

type Store = {
  ready: boolean;
  airline: AirlineState;
  setAirline: (next: AirlineState) => void;
  patch: (partial: Partial<AirlineState>) => void;
};

const AirlineContext = createContext<Store | null>(null);

export function AirlineProvider({ children }: { children: ReactNode }) {
  const [airline, setAirlineState] = useState<AirlineState>(emptyAirline);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAirlineState({ ...emptyAirline(), ...JSON.parse(raw) });
    } catch {
      /* keep the empty airline */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(airline));
  }, [airline, ready]);

  const store = useMemo<Store>(
    () => ({
      ready,
      airline,
      setAirline: setAirlineState,
      patch: (partial) => setAirlineState((current) => ({ ...current, ...partial })),
    }),
    [airline, ready],
  );

  return <AirlineContext.Provider value={store}>{children}</AirlineContext.Provider>;
}

export function useAirline(): Store {
  const store = useContext(AirlineContext);
  if (!store) throw new Error("useAirline must be used inside AirlineProvider");
  return store;
}

export function newId(): string {
  return crypto.randomUUID();
}
