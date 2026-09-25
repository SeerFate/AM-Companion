export type GuideBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "formula"; label: string; text: string };

export type GuideSection = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

export const guideSections: GuideSection[] = [
  {
    id: "planes",
    title: "Planes",
    blocks: [
      {
        kind: "p",
        text: "No planes, no profit. There are more than 400 aircraft, so the purchase decision is price, capacity, speed, then fuel and CO2. Speed matters more than efficiency: a faster plane covers more distance in the same time. A fast plane with short range can still be a problem if you cannot stay online to depart short flights.",
      },
      {
        kind: "list",
        items: [
          "1 business seat takes the space of 2 economy seats.",
          "1 first-class seat takes the space of 3 economy seats.",
          "100% large cargo holds 70% of the published capacity. Large load is more profitable than heavy load.",
          "Large cargo demand = economy demand × 500. Heavy cargo demand = business demand × 1,000.",
          "Several cheaper planes beat one expensive plane. Ten DC-9-10s carry 900 people for about the price of one DC-10-10.",
          "Fuel is lbs per km. A 20 lbs/km plane on a 5,000 km route burns 20 × 10,000 lbs on the round figure used in the guide, because the worked example treats the trip as 10,000 km of flying.",
          "CO2 for passengers is roughly consumption × (Y + J×2 + F×3) × distance. There is a random factor, so it is not exact. Cargo uses kg per 1,000 lbs.",
        ],
      },
      {
        kind: "formula",
        label: "Passenger planes the guide calls best",
        text: "Starter: DC-9-10, BAe 146-300. Second stage: MC-21-400, DC-10-10. Mid game: IL-96-400, 747SP. End game: 747-8, A380-800.",
      },
      {
        kind: "formula",
        label: "Cargo planes the guide calls best",
        text: "Start: A400M, 757-200F. Second: IL-96T, A330-200F. Third: 747-400F, 747-8F. End: A380-800F, An-225. The An-124 is not more profitable than the 747-8F because it is slow.",
      },
    ],
  },
  {
    id: "routes",
    title: "Routes",
    blocks: [
      {
        kind: "p",
        text: "Flight duration should match when you can actually depart. If you can send planes often, short routes earn more because ticket price is a straight line, Ax + B, so the fixed part of the fare is a bigger share of a short flight. If you cannot depart about every 2 hours, fly long haul. A plane on the ground earns nothing.",
      },
      {
        kind: "list",
        items: [
          "Every route has a daily passenger cap. A 250-economy plane on 1,000 economy demand uses that cabin up in a handful of flights. Put business and first seats on the plane so economy demand lasts longer.",
          "Look for enough demand that the plane does not have to sit because a cabin is empty.",
          "A stopover is only a refueling stop. It does not add passengers.",
          "Ticket price uses the direct distance from hub to destination, not the longer path via the stop. Keep the path as straight as you can.",
          "Passenger prices: auto × 1.10 economy, × 1.08 business, × 1.06 first. Round down to the nearest 1.",
          "Cargo prices: auto × 1.10 large, × 1.08 heavy. Round down to the nearest 0.01.",
          "Demand refills at 01:00 UTC. The same city pair shares one demand in both directions.",
        ],
      },
      {
        kind: "formula",
        label: "Easy autoprice, then the guide markup",
        text: "Y = 0.4d + 170, then × 1.10. J = 0.8d + 560, then × 1.08. F = 1.2d + 1200, then × 1.06. Realism uses 0.3d+150, 0.6d+500, and 0.9d+1000 before the same markups. d is direct kilometres.",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    blocks: [
      {
        kind: "p",
        text: "There are A-checks and wear. Most planes need an A-check after about 350 to 500 flight hours. Do them. Skipping A-checks can get the airline audited. The plane has to be at a hub or your base.",
      },
      {
        kind: "list",
        items: [
          "A-checks include wear, so a separate wear repair is rarely needed if checks stay current.",
          "At 50% wear the plane stops contributing to the alliance.",
          "At 90% wear the game grounds it until you repair.",
        ],
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    blocks: [
      {
        kind: "p",
        text: "Planes look half empty because the starting reputation is 49%. Marketing is the only way above that, and campaigns have to be bought again. On a DC-9 or BAe 146, buy the eco campaign and skip the expensive reputation campaign. Once you are on an MC-21 or DC-10, add reputation. The 4th campaign is the strongest and also the one that can dump you to about 18% reputation. The 3rd is the safer buy.",
      },
    ],
  },
  {
    id: "fuel",
    title: "Fuel and CO2",
    blocks: [
      {
        kind: "list",
        items: [
          "Fuel moves between $300 and $3,000 per 1,000 lbs and changes every 30 minutes.",
          "A small tank should buy under $1,000. A tank that holds days of flying can wait for under $500, or under $400. Fuel bonanzas can go under $300.",
          "Never let CO2 go negative. Reputation drops 10%, and the eco campaign cannot add its 10% while you are negative.",
          "CO2 moves between $100 and $200 per 1,000 quotas. Under $120 is cheap. Bonanzas happen here too.",
          "Quotas look cheap per unit and are not, because a flight burns far more quotas than pounds of fuel.",
        ],
      },
    ],
  },
  {
    id: "staff",
    title: "Staff",
    blocks: [
      {
        kind: "p",
        text: "Low morale means fewer passengers. The million-dollar tip lowers salary without staying at low morale: finish management training, cut pay until the game says salary cannot go lower below 50% morale, raise pay back to 100% morale, and repeat until the salary is at its floor.",
      },
    ],
  },
  {
    id: "stock",
    title: "Stock market",
    blocks: [
      {
        kind: "list",
        items: [
          "The market opens after the IPO. A share costs the current share value.",
          "Buy low, sell high. Someone else buying your shares pays you nothing.",
          "Cap is 20,000 shares in one company and 100,000 shares in total.",
          "Buying extra shares of your own airline costs 300 points and is not worth it.",
          "The same money usually earns more in aircraft than in the market.",
        ],
      },
    ],
  },
  {
    id: "training",
    title: "Training",
    blocks: [
      {
        kind: "list",
        items: [
          "Each training spends one point. Points come from leveling, and departures level you.",
          "Management training is required before the salary tip works.",
          "Operations training cuts wear, repair cost, fuel, and CO2.",
          "Event training unlocks events.",
          "Service training raises the fleet limit and unlocks catering.",
          "Cargo training, after cargo is unlocked, raises the cargo fleet limit and load capacity by 6%.",
          "Do fleet-manager training first. It is worth 28 extra planes. Spare points do nothing once every track is finished.",
        ],
      },
    ],
  },
  {
    id: "points",
    title: "Bonus points",
    blocks: [
      {
        kind: "list",
        items: [
          "A hub costs 20 points.",
          "Fuel tank +2,500,000 lbs costs 400 points. CO2 tank +2,500,000 quotas costs 300 points.",
          "Unlocking cargo costs 450 points.",
          "Points come from achievements, a random 1–4 while departing, an AM3 bonus code, or the shop.",
        ],
      },
    ],
  },
  {
    id: "hubs",
    title: "Hubs",
    blocks: [
      {
        kind: "p",
        text: "Planes need routes. When a hub runs out of good ones, buy another. The guide’s short list:",
      },
      {
        kind: "list",
        items: [
          "Asia: ICN, SIN, HKG, DEL, DXB, BAH.",
          "Australia and Pacific: SYD, CBR, NAN (long haul only).",
          "Europe: LHR, AMS, FRA, CDG.",
          "North America: JFK, DFW, ORD, LAX.",
          "South America: GRU, SCL, CCS, EZE.",
          "Africa: TUN, LAD, DKR.",
        ],
      },
    ],
  },
  {
    id: "other",
    title: "Other features",
    blocks: [
      {
        kind: "list",
        items: [
          "Banking unlocks at level 10. The bank takes a 2% deposit fee and pays no interest. Do not use it.",
          "Catering is sold only on outbound flights from the hub you stock. If the meals sell out, you wait until the contract ends. Train other things first.",
          "Loyalty points: +1 when you upvote, +2 when someone upvotes you, −4 when someone downvotes you. The promised bonus-point conversion was not available when the guide was written.",
        ],
      },
    ],
  },
  {
    id: "math",
    title: "How this desk uses the numbers",
    blocks: [
      {
        kind: "p",
        text: "Distances use the same haversine the game uses internally, with an Earth diameter of 12,742 km. The in-game research panel uses a slightly different formula. Copy the distance from a route you already opened if a fare comes out empty, and drop a dollar or two below the rounded price.",
      },
      {
        kind: "list",
        items: [
          "Easy mode cruise is 1.5× the listed speed. Realism uses the listed speed.",
          "Cost index 200 is full speed. Index 0 is 30% of that speed. Lowering the index stretches a short flight so it finishes on your departure slot.",
          "Block time is flown kilometres divided by that speed. A stopover adds the two legs for time and fuel. Fares still use the straight-line distance.",
          "Seats are filled from the cabin that earns the most per economy-sized space, capped by demand divided by flights that day.",
          "On easy mode, first class wins that comparison under 14,425 km. Past about 15,200 km, economy wins. Realism flips later, and business leads through the middle band.",
          "Fill is your reputation percent, matching the guide. Community measurements put the real average a little under that when fares sit above autoprice.",
        ],
      },
    ],
  },
];
