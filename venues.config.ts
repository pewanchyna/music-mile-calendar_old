import { Venue } from "./types";

/**
 * Music Mile Venue Configuration
 * Define each venue with its data source strategy
 */

export const MUSIC_MILE_VENUES: Venue[] = [
  // --- API Sources ---
  {
    name: "Ironwood Stage & Grill",
    slug: "ironwood-stage-grill",
    address: "1229 9 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0R2",
    phone: "403-269-5581",
    website: "https://ironwoodstage.ca",
    dataSource: {
      method: "bandsintown",
    },
  },
  {
    name: "King Eddy",
    slug: "king-eddy",
    address: "438 9 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0R9",
    phone: "403-829-6016",
    website: "https://kingeddy.ca",
    dataSource: {
      method: "bandsintown",
    },
  },
  {
    name: "Studio Bell (National Music Centre)",
    slug: "studio-bell",
    address: "850 4 St SE",
    city: "Calgary",
    postalCode: "T2G 1R1",
    phone: "403-543-5115",
    website: "https://studiobell.ca",
    dataSource: {
      method: "eventbrite",
      identifier: "YOUR_EVENTBRITE_ORG_ID", // Get this from studiobell.ca eventbrite page
    },
  },
  {
    name: "The Attic",
    slug: "the-attic",
    address: "2nd floor, 1413 9 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0J8",
    website: "https://www.theatticYYC.ca",
    dataSource: {
      method: "eventbrite",
      identifier: "YOUR_ATTIC_EVENTBRITE_ORG_ID",
    },
  },

  // --- Web Scrapers ---
  {
    name: "Festival Hall",
    slug: "festival-hall",
    address: "1215 10 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0S4",
    website: "https://www.calgaryfolkfest.com/festival-hall/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Gravity Espresso & Wine Bar",
    slug: "gravity-espresso-wine",
    address: "909 10 St SE",
    city: "Calgary",
    postalCode: "T2G 3G6",
    website: "https://www.cafegravity.com/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Hawthorn",
    slug: "hawthorn",
    address: "133 9th Ave SW",
    city: "Calgary",
    postalCode: "T2P 1K2",
    website: "https://www.hawthorndiningroom.ca/event/live-entertainment/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "The Hose & Hound",
    slug: "hose-and-hound",
    address: "1030 9 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0S2",
    phone: "403-262-4735",
    website: "https://www.thehose.ca/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "The Eden",
    slug: "the-eden",
    address: "1219 9 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0J8",
    website: "http://www.edenbistro.ca",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "The Nash [Offcut Bar]",
    slug: "offcut-bar",
    address: "925 11 St SE",
    city: "Calgary",
    postalCode: "T2G 3G9",
    website: "https://www.offcutbar.com/sesh",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Inglewood Night Market",
    slug: "inglewood-night-market",
    address: "Varied Indoor and Outdoor Locations",
    city: "Calgary",
    postalCode: "T2G",
    website: "https://www.inglewoodnightmarket.ca/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Lantern Community Church",
    slug: "lantern-community-church",
    address: "1401 10 Ave SE",
    city: "Calgary",
    postalCode: "T2G 0S6",
    phone: "403-234-9116",
    website: "https://www.lanternchurch.com",
    dataSource: {
      method: "scrape",
    },
  },

  // --- Parks/Outdoor Venues (Limited event data) ---
  {
    name: "C-Square (Celebration Square)",
    slug: "c-square",
    address: "4 St & 7 Ave SE, East Village",
    city: "Calgary",
    postalCode: "T2G",
    website: "https://www.evexperience.com/",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Music Pavilion at East Village",
    slug: "music-pavilion",
    address: "East Village RiverWalk",
    city: "Calgary",
    postalCode: "T2G",
    website: "https://www.evexperience.com/paths-and-parks",
    dataSource: {
      method: "scrape",
    },
  },
  {
    name: "Central Library",
    slug: "central-library",
    address: "802 3 St SE",
    city: "Calgary",
    postalCode: "T2G 0A1",
    phone: "403-260-2600",
    website: "https://calgarylibrary.ca/read-learn-and-explore/central-library/",
    dataSource: {
      method: "scrape",
    },
  },

  // --- Non-music venues (included for completeness) ---
  // Esker Foundation - art gallery, skip
  // Recordland - record store, minimal events
  // Riverwalk Plaza / St. Patrick's Island - seasonal/parks only
];

/**
 * High-priority venues to fetch first
 */
export const PRIORITY_VENUES = MUSIC_MILE_VENUES.filter((v) =>
  ["ironwood-stage-grill", "king-eddy", "studio-bell", "festival-hall"].includes(
    v.slug
  )
);

/**
 * Find venue by slug
 */
export function getVenueBySlug(slug: string): Venue | undefined {
  return MUSIC_MILE_VENUES.find((v) => v.slug === slug);
}
