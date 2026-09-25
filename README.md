# AM4 desk

A personal companion for [Airline Manager 4](https://airlinemanager.com/). It keeps the guide, your fleet, and your routes in one place, then works out fares, seat mixes, and destinations that fit the hours you can actually depart.

Nothing here talks to the game. Demand, reputation, and fuel prices are numbers you type in. The airline is stored in this browser.

## Run

```bash
npm install
npm run dev
```

The dev server in this workspace listens on port 43123.

## What it uses

- The long “Everything about AM4” guide for play, not just the formulas: which planes, when to buy fuel, marketing, hubs, and the salary tip.
- Community formulas for autoprice, the 1.10 / 1.08 / 1.06 markups, haversine distance, easy-mode speed, cost index, and seat order. Those are documented in the Guide tab.
- Aircraft and airport lists published with the open AM4 formula notes.

Ticket price uses the straight-line distance. A stopover changes flight time and fuel only. Easy mode flies at 1.5× the listed speed. Cost index 200 is full speed; a lower index stretches a short flight so it is ready on a 2-hour or 4-hour departure.

If a fare in the game comes back empty, the research panel’s distance can differ by a kilometre or two. Drop the price by a dollar or two.
