# AM4 desk

A personal companion for [Airline Manager 4](https://airlinemanager.com/). It keeps the guide, your fleet, and your routes in one place, then works out fares, seat mixes, and destinations that fit the hours you can actually depart.

Nothing here talks to the game. Demand, reputation, and fuel prices are numbers you type in. The airline is stored in this browser.

## Run

```bash
npm install
npm run dev
```

The dev server in this workspace listens on port 43123.

## Android

`release/AM4-desk.apk` is the offline app. Copy it to the phone, allow installs from your files app, and open it. The desk is stored inside the APK, so the first launch works with no network and no server. Your airline stays on that phone. Move a copy to the computer, or back, with Export JSON and Import JSON.

The package name is `com.am4desk.app`. Installing a newer build signed with a different key means uninstalling the old one first.

To rebuild it:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

That requires a JDK and Android SDK 36. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

The browser version can still be installed from Chrome with **Add to Home screen** after one visit. That copy is cached. The APK does not need the visit.

## What it uses

- The long “Everything about AM4” guide for play, not just the formulas: which planes, when to buy fuel, marketing, hubs, and the salary tip.
- Community formulas for autoprice, the 1.10 / 1.08 / 1.06 markups, haversine distance, easy-mode speed, cost index, and seat order. Those are documented in the Guide tab.
- Aircraft and airport lists published with the open AM4 formula notes.

Ticket price uses the straight-line distance. A stopover changes flight time and fuel only. Easy mode flies at 1.5× the listed speed. Cost index 200 is full speed; a lower index stretches a short flight so it is ready on a 2-hour or 4-hour departure.

If a fare in the game comes back empty, the research panel’s distance can differ by a kilometre or two. Drop the price by a dollar or two.
