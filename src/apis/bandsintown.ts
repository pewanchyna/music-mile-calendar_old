import { MusicEvent, Venue } from "../types";

/**
 * Bandsintown API client
 * Uses their public API (no auth required for venue lookups)
 * Docs: https://www.bandsintown.com/api/overview
 */

const BANDSINTOWN_API = "https://rest.bandsintown.com";
const APP_ID = "music_mile_calendar"; // Register your own app at bandsintown.com/api

interface Bandsintown_Event {
  id: number;
  title: string;
  description: string;
  datetime: string; // ISO 8601
  venue: {
    name: string;
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    country: string;
  };
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup: string[];
}

interface BandsindownVenue {
  id: number;
  name: string;
  url: string;
}

export class BandsindownClient {
  async getVenueByName(venueName: string): Promise<BandsindownVenue | null> {
    try {
      const response = await fetch(
        `${BANDSINTOWN_API}/venues/search?query=${encodeURIComponent(venueName)}&app_id=${APP_ID}`
      );

      if (!response.ok) {
        console.error(`Bandsintown API error for ${venueName}:`, response.status);
        return null;
      }

      const venues = (await response.json()) as BandsindownVenue[];
      return venues.length > 0 ? venues[0] : null;
    } catch (error) {
      console.error(`Error fetching Bandsintown venue: ${venueName}`, error);
      return null;
    }
  }

  async getVenueEvents(venueId: number): Promise<Bandsintown_Event[]> {
    try {
      const response = await fetch(
        `${BANDSINTOWN_API}/venues/${venueId}/events?app_id=${APP_ID}`
      );

      if (!response.ok) {
        console.error(
          `Bandsintown venue events error (${venueId}):`,
          response.status
        );
        return [];
      }

      return (await response.json()) as Bandsintown_Event[];
    } catch (error) {
      console.error(`Error fetching events from Bandsintown venue ${venueId}:`, error);
      return [];
    }
  }

  /**
   * Normalize Bandsintown event to our unified schema
   */
  normalizeEvent(
    rawEvent: Bandsintown_Event,
    venue: Venue
  ): MusicEvent {
    const startDate = new Date(rawEvent.datetime);
    const eventId = `${venue.slug}_bandsintown_${rawEvent.id}`;

    // Extract ticket URL if available
    const ticketOffer = rawEvent.offers?.find(
      (o) => o.type === "ticketmaster" || o.type === "songkick"
    );

    return {
      id: eventId,
      title: rawEvent.title || "Live Music",
      venue,
      date: {
        start: startDate,
        startTime: startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      },
      artists: rawEvent.lineup || [],
      description: rawEvent.description,
      ticketInfo: {
        url: ticketOffer?.url,
        isFree: !ticketOffer,
      },
      source: {
        platform: "bandsintown",
        url: `https://www.bandsintown.com/e/${rawEvent.id}`,
        lastUpdated: new Date(),
      },
    };
  }
}

export default new BandsindownClient();
