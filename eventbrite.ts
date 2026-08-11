import { MusicEvent, Venue } from "../types";

/**
 * Eventbrite API client
 * Requires a personal access token from eventbrite.com/api
 * Store your token in env var: EVENTBRITE_API_KEY
 * Docs: https://www.eventbrite.com/api/v3/
 */

const EVENTBRITE_API = "https://www.eventbriteapi.com/v3";
const API_KEY = process.env.EVENTBRITE_API_KEY || "";

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description?: { text: string };
  start: { utc: string; timezone: string };
  end: { utc: string; timezone: string };
  venue_id?: string;
  logo?: { url: string };
  url: string;
  status: string;
  ticket_classes?: Array<{
    name: string;
    cost?: {
      currency: string;
      value: number;
    };
  }>;
}

interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1?: string;
    city?: string;
    postal_code?: string;
  };
}

export class EventbriteClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_KEY;
    if (!this.apiKey) {
      console.warn(
        "⚠️  Eventbrite API key not found. Set EVENTBRITE_API_KEY env var."
      );
    }
  }

  /**
   * Search for organization/venue by name
   * Note: Eventbrite limits free tier searches; may need to manually find org ID
   */
  async searchOrganization(query: string): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${EVENTBRITE_API}/organizations/?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { organizations?: Array<{ id: string }> };
      return data.organizations?.[0]?.id || null;
    } catch (error) {
      console.error(`Eventbrite org search error:`, error);
      return null;
    }
  }

  /**
   * Get events for an organization
   * organizationId can be found on eventbrite.com (in URL or org settings)
   */
  async getOrganizationEvents(organizationId: string): Promise<EventbriteEvent[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${EVENTBRITE_API}/organizations/${organizationId}/events/?status=live,completed`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );

      if (!response.ok) {
        console.error(`Eventbrite events error (${organizationId}):`, response.status);
        return [];
      }

      const data = (await response.json()) as { events?: EventbriteEvent[] };
      return data.events || [];
    } catch (error) {
      console.error(
        `Error fetching events from Eventbrite org ${organizationId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get venue details
   */
  async getVenue(venueId: string): Promise<EventbriteVenue | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${EVENTBRITE_API}/venues/${venueId}/`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) return null;
      return (await response.json()) as EventbriteVenue;
    } catch (error) {
      console.error(`Error fetching venue ${venueId}:`, error);
      return null;
    }
  }

  /**
   * Normalize Eventbrite event to our unified schema
   */
  normalizeEvent(rawEvent: EventbriteEvent, venue: Venue): MusicEvent {
    const startDate = new Date(rawEvent.start.utc);
    const eventId = `${venue.slug}_eventbrite_${rawEvent.id}`;

    // Determine if paid or free
    const hasTickets = rawEvent.ticket_classes && rawEvent.ticket_classes.length > 0;
    const isFree = !hasTickets || rawEvent.ticket_classes?.some((tc) => !tc.cost);

    return {
      id: eventId,
      title: rawEvent.name.text,
      venue,
      date: {
        start: startDate,
        end: rawEvent.end ? new Date(rawEvent.end.utc) : undefined,
        startTime: startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      },
      description: rawEvent.description?.text,
      ticketInfo: {
        url: rawEvent.url,
        isFree,
      },
      images: {
        thumbnail: rawEvent.logo?.url,
      },
      source: {
        platform: "eventbrite",
        url: rawEvent.url,
        lastUpdated: new Date(),
      },
    };
  }
}

export default new EventbriteClient();
