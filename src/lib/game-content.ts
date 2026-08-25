export const gamePitch =
  "Provincia is a Roman colony builder on a fixed terrace grid. You are the curator of a small colonia at the edge of the province — survey the land, route water, house families, and keep the haul board moving as refugees arrive from the road.";

export const heroTagline = "Rome gave you the outline.";
export const heroTaglineAccent = "The terraces don't care.";

export const heroSubtitle =
  "Terrace planning, living water, stone aqueducts, colonist logistics, and battles on the grant. Pre-alpha — follow the build on DevTalk.";

export const curatorQuote =
  "What Rome gave you is small. What you make of it is yours.";

/** Benefit-focused blocks for the landing page (player language, not engine docs). */
export const landingFeatures = [
  {
    id: "planning",
    title: "Plan on stepped ground",
    text: "Survey a fixed grant on 1 m terraces. Housing districts, roads, quarries, and workshops snap to the same grid the simulation reads — so placement is planning, not painting.",
    image: "/game/housing-district.png",
    imageAlt: "Housing district beside a stone aqueduct",
  },
  {
    id: "water",
    title: "Living water & aqueducts",
    text: "Ponds, wells, and stone runs use a real flow model. Cut a channel through a terrace and it drains somewhere. Route water before your colonists run dry.",
    image: "/game/aqueduct.jpg",
    imageAlt: "Stone aqueduct carrying water past the colonia",
  },
  {
    id: "logistics",
    title: "Colonists carry the load",
    text: "Timber, stone, and food move by haul jobs — not magic. Workshops stall when stockpiles run empty. Growth is logistics, not just placing buildings.",
    image: "/game/production.jpg",
    imageAlt: "Workshops and production buildings on the colony grid",
  },
  {
    id: "battles",
    title: "Defend the colonia",
    text: "When word of your grant spreads, so does trouble. Form lines on the terrace, hold the aqueduct wall, and keep the settlement standing.",
    image: "/game/battle-overview.png",
    imageAlt: "Roman infantry formation facing a fortified colonia",
  },
];

export const homepagePillars = [
  {
    title: "Plan on a terrace grid",
    text: "A 200×200 cell map with 1 m height steps. Roads, housing districts, quarries, and aqueducts all snap to the same coordinates the simulation reads.",
  },
  {
    title: "Water is not decoration",
    text: "Ponds, wells, and aqueducts run through a cellular-automata model. Colonists drink from wet ground. A channel cut through a terrace actually drains somewhere.",
  },
  {
    title: "Colonists carry the load",
    text: "Day and night cycles, haul jobs, production chains, and happiness that speeds work up or slows it down. Growth is logistics, not just placing buildings.",
  },
];

export const gameSystems = [
  {
    id: "grid",
    title: "Grid-first planning",
    text: "Buildings come from CSV rows — footprint, cost, workers, scene path. Placement updates occupancy layers for paths, sewage underlays, and construction reserves. One coordinate system for tools, rendering, and simulation.",
    image: "/game/colony-overview.png",
    imageAlt: "Settlement overview with aqueduct and cathedral",
  },
  {
    id: "water",
    title: "Cellular-automata water",
    text: "Water moves downhill by hydraulic head (terrain height + depth). Building cells block flow. Wells push harder than springs. Aqueduct piers stay permeable so channels stay connected to the grid.",
    image: "/game/aqueduct.jpg",
    imageAlt: "Stone aqueduct spanning past town buildings",
  },
  {
    id: "housing",
    title: "Housing on slopes",
    text: "Drag a district zone and a solver packs hut clusters along paths, respecting flat-enough terrain and door heights. Large zones lean on a native BFS extension to stay under a one-second layout budget.",
    image: "/game/housing-district.png",
    imageAlt: "Dense housing district with aqueduct edge",
  },
  {
    id: "colonists",
    title: "Jobs, hauls, needs",
    text: "Town hall spawns workers and holds stockpiles. Foresters, quarries, and workshops pull from a shared haul board. Thirsty colonists path to wet cells. Happiness nudges walk speed between half and one-and-a-half.",
    image: "/game/production.jpg",
    imageAlt: "Production buildings and workshop chain",
  },
  {
    id: "battles",
    title: "Battles on the grant",
    text: "Deterministic melee on the same terrace grid — form infantry, hold the aqueduct wall, and keep the colonia standing when raiders arrive.",
    image: "/game/battle-clash.png",
    imageAlt: "Battle clash near the colonia aqueduct wall",
  },
];

export const galleryImages = [
  { src: "/game/colony-overview.png", alt: "Settlement overview from the itch capture pack" },
  { src: "/game/housing-district.png", alt: "Housing district beside the aqueduct" },
  { src: "/game/aqueduct.jpg", alt: "Water aqueduct through the colonia" },
  { src: "/game/town-hall.jpg", alt: "Town hall close-up among the trees" },
  { src: "/game/production.jpg", alt: "Production and workshop buildings" },
  { src: "/game/battle-overview.png", alt: "Infantry formation facing the colonia" },
  { src: "/game/battle-clash.png", alt: "Battle clash at the aqueduct wall" },
  { src: "/game/title-secondary.png", alt: "Secondary title key art from the build" },
  { src: "/game/colonist-working.png", alt: "Roman colonist at work" },
  { src: "/game/housing-stage-01.png", alt: "Early-stage Roman housing" },
  { src: "/game/housing-stage-04.png", alt: "Upgraded Roman housing" },
  { src: "/game/curator-portrait.png", alt: "Curator portrait from the tutorial" },
];

export const coreLoop = [
  "Survey the grant — pan, orbit, read the terraces and ponds already on your land.",
  "Place paths, housing districts, and work buildings from a CSV-driven palette.",
  "Route water with wells, channels, and aqueducts; keep wet ground reachable.",
  "Balance stone, timber, and food as families arrive and expect beds.",
  "Form lines when raiders come — the aqueduct wall is yours to hold.",
  "Expand from a charter village into something that feels like a province.",
];

export const developmentStatus =
  "Provincia is in active pre-alpha. Core placement, water, housing layout, colonist logistics, and battles are playable in the Godot build. Download a build below — expect bugs. No Steam page yet.";

export const downloadReleaseTag = "656efbf";

export const downloadPageUrl = "https://cybersaemi.itch.io/provincia";

export const downloadBuilds = [
  {
    id: "windows",
    label: "Windows",
    file: "provincia-windows.zip",
    href: downloadPageUrl,
    hint: "Unzip and run Provincia.exe",
  },
  {
    id: "macos",
    label: "macOS",
    file: "provincia-osx.zip",
    href: downloadPageUrl,
    hint: "Unzip and open Provincia.app",
  },
  {
    id: "linux",
    label: "Linux",
    file: "provincia-linux.zip",
    href: downloadPageUrl,
    hint: "Unzip and run Provincia.x86_64",
  },
] as const;

export const storeLinks = {
  steam: null as string | null,
  itch: "https://cybersaemi.itch.io/provincia" as string | null,
  discord: null as string | null,
  downloads: "/#download",
};

