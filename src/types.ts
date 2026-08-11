/**
 * Unified event schema for Music Mile venues
 * All external data sources (APIs, scraped HTML) are normalized to this format
 */

export interface MusicEvent {
  id: string; // Unique identifier: "{venue_slug}_{source_id}"
  title: string;
  venue: {
    name: string;
    slug: string; // e.g., "ironwood-stage-grill"
    address: string;
    city: string;
    postalCode: string;
    phone?: string;
    website?: string;
  };
  date: {
    start: Date; // ISO 8601 string or Date object
    end?: Date; // Optional for multi-hour events
    startTime?: string; // HH:mm format, e.g., "19:00"
    endTime?: string;
  };
  artists?: string[]; // Lineup names
  description?: string;
  ticketInfo?: {
    url?: string;
    price?: string;
    isFree?: boolean;
  };
  images?: {
    thumbnail?: string;
    full?: string;
  };
  source: {
    platform: "bandsintown" | "eventbrite" | "scraped" | "manual";
    url: string; // Link to event on original platform or venue site
    lastUpdated: Date;
  };
  categories?: string[]; // e.g., ["jazz", "live-music", "dinner"]
}

export interface Venue {
  name: string;
  slug: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  website: string;
  dataSource: {
    method: "bandsintown" | "eventbrite" | "scrape";
    identifier?: string; // API ID or URL
  };
}

export interface ScraperResult {
  venue: Venue;
  events: MusicEvent[];
  fetchedAt: Date;
  success: boolean;
  error?: string;
}

export interface CalendarExport {
  updatedAt: Date;
  venueCount: number;
  eventCount: number;
  events: MusicEvent[];
}
