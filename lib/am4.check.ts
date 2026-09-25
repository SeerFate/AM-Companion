import assert from "node:assert/strict";
import {
  ciForSlot,
  configurePax,
  flightHours,
  fuelLbs,
  haversineKm,
  optimalCargo,
  optimalPax,
} from "./am4";

const easy = optimalPax(5000, "easy");
assert.equal(easy.y, 2387);
assert.equal(easy.j, 4924);
assert.equal(easy.f, 7632);

const realism = optimalPax(0, "realism");
assert.equal(realism.y, 165);
assert.equal(realism.j, 540);
assert.equal(realism.f, 1060);

const cargo = optimalCargo(1000, "easy");
assert.ok(cargo.large > cargo.heavy);

assert.equal(flightHours(1500, 1000, "easy", 200), 1);
assert.ok(Math.abs(flightHours(1500, 1000, "realism", 200) - 1.5) < 1e-9);

const slot = ciForSlot(1500, 1000, "easy", 2);
assert.ok(slot);
assert.ok(slot.hours <= 2);
assert.equal(ciForSlot(1500, 1000, "easy", 0.5), null);

const seats = configurePax({
  capacity: 600,
  demand: { y: 1779, j: 395, f: 198 },
  flightsPerDay: 6,
  distanceKm: 4000,
  mode: "easy",
});
assert.deepEqual(seats.order, ["f", "j", "y"]);
assert.equal(seats.seats.f, 33);
assert.equal(seats.seats.j, 65);
assert.equal(seats.seats.y, 296);

const same = haversineKm(0, 0, 0, 0);
assert.equal(same, 0);
const fuel = fuelLbs({ consumption: 20, distanceKm: 5000, ci: 200 });
assert.equal(fuel, 20 * 5000 * 1);

console.log("am4 checks passed");
