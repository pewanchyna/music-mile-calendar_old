import { MusicEvent, Venue, CalendarExport, ScraperResult } from "./types";
import bandsintown from "./apis/bandsintown";
import eventbrite from "./apis/eventbrite";
import {
  scrapeIronwood,
  scrapeFestivalHall,
  scrapeHoseAndHound,
  scrapeTheAttic,
  scrapeGravity,
  genericScraper,
} from "./scrapers/venueScrapers";

/**
 * Music Mile Calendar Coordinator
 * Orchestrates data collection from all sources (APIs + scrapers)
 * Normalizes, deduplicates, and exports unified event calendar
 */

export class CalendarCoordinator {
  private venues: Venue[];
  private allEvents: MusicEvent[] = [];

  constructor(venues: Venue[]) {
    this.venues = venues;
  }

  /**
   * Main execution - fetch all venue events
   */
  async fetchAllEvents(): Promise<CalendarExport> {
    console.log(`🎵 Fetching events for ${this.venues.length} venues...`);

    const results = await Promise.allSettled(
      this.venues.map((venue) => this.fetchVenueEvents(venue))
    );

    // Collect all events from successful fetches
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        const scraperResult = result.value;
        console.log(
          `✓ ${scraperResult.venue.name}: ${scraperResult.events.length} events`
        );
        this.allEvents.push(...scraperResult.events);
      } else {
        console.log(
          `✗ ${this.venues[idx].name}: ${result.reason.message || "Unknown error"}`
        );
      }
    });

    // Deduplicate events
    this.allEvents = this.deduplicateEvents(this.allEvents);

    // Sort by date
    this.allEvents.sort(
      (a, b) => a.date.start.getTime() - b.date.start.getTime()
    );

    console.log(`\n📅 Total unique events: ${this.allEvents.length}`);

    return {
      updatedAt: new Date(),
      venueCount: this.venues.length,
      eventCount: this.allEvents.length,
      events: this.allEvents,
    };
  }

  /**
   * Fetch events for a single venue using appropriate strategy
   */
  private async fetchVenueEvents(venue: Venue): Promise<ScraperResult> {
    let events: MusicEvent[] = [];

    try {
      const source = venue.dataSource;

      if (source.method === "bandsintown") {
        // Use Bandsintown API
        const bandsindownVenue = await bandsintown.getVenueByName(venue.name);
        if (bandsindownVenue) {
          const rawEvents = await bandsintown.getVenueEvents(bandsindownVenue.id);
          events = rawEvents.map((e) => bandsintown.normalizeEvent(e, venue));
        }
      } else if (source.method === "eventbrite") {
        // Use Eventbrite API
        if (source.identifier) {
          const rawEvents = await eventbrite.getOrganizationEvents(
            source.identifier
          );
          events = rawEvents.map((e) => eventbrite.normalizeEvent(e, venue));
        }
      } else if (source.method === "scrape") {
        // Use web scraper based on venue
        events = await this.scrapeVenue(venue);
      }

      return {
        venue,
        events,
        fetchedAt: new Date(),
        success: true,
      };
    } catch (error) {
      return {
        venue,
        events: [],
        fetchedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Route to appropriate scraper based on venue name
   */
  private async scrapeVenue(venue: Venue): Promise<MusicEvent[]> {
    const slug = venue.slug.toLowerCase();

    // Route to specific scrapers
    if (slug.includes("ironwood")) return scrapeIronwood(venue);
    if (slug.includes("festival")) return scrapeFestivalHall(venue);
    if (slug.includes("hose")) return scrapeHoseAndHound(venue);
    if (slug.includes("attic")) return scrapeTheAttic(venue);
    if (slug.includes("gravity")) return scrapeGravity(venue);

    // Fallback to generic scraper
    return genericScraper(venue);
  }

  /**
   * Deduplicate events by title + date + venue
   * (Different sources might list the same event)
   */
  private deduplicateEvents(events: MusicEvent[]): MusicEvent[] {
    const seen = new Set<string>();
    const unique: MusicEvent[] = [];

    for (const event of events) {
      // Create fingerprint: venue + normalized title + date
      const dateStr = event.date.start.toISOString().split("T")[0];
      const normalizedTitle = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const fingerprint = `${event.venue.slug}|${normalizedTitle}|${dateStr}`;

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        unique.push(event);
      }
    }

    return unique;
  }

  /**
   * Export to JSON for API/storage
   */
  toJSON(): string {
    const data = {
      updatedAt: new Date().toISOString(),
      venueCount: this.venues.length,
      eventCount: this.allEvents.length,
      events: this.allEvents.map((event) => ({
        id: event.id,
        title: event.title,
        venue: event.venue,
        date: {
          start: event.date.start.toISOString(),
          end: event.date.end?.toISOString(),
          startTime: event.date.startTime,
        },
        artists: event.artists,
        description: event.description,
        ticketInfo: event.ticketInfo,
        images: event.images,
        source: {
          platform: event.source.platform,
          url: event.source.url,
          lastUpdated: event.source.lastUpdated.toISOString(),
        },
        categories: event.categories,
      })),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to iCal format (.ics file)
   * Can be imported into any calendar app
   */
  toICalendar(): string {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Music Mile//Music Mile Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Music Mile Calendar",
      "X-WR-CALDESC:Live music events in Calgary's Music Mile",
      "X-WR-TIMEZONE:America/Edmonton",
    ];

    for (const event of this.allEvents) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${event.id}@musicmile.local`);
      lines.push(`DTSTAMP:${this.formatICalDateTime(new Date())}`);
      lines.push(`DTSTART:${this.formatICalDateTime(event.date.start)}`);

      if (event.date.end) {
        lines.push(`DTEND:${this.formatICalDateTime(event.date.end)}`);
      }

      lines.push(`SUMMARY:${this.escapeICalText(event.title)} @ ${event.venue.name}`);

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      }

      lines.push(`LOCATION:${this.escapeICalText(event.venue.address)}`);

      if (event.source.url) {
        lines.push(`URL:${event.source.url}`);
      }

      lines.push(`CATEGORIES:${event.categories?.join(",") || "Live Music"}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  /**
   * Export to simple JSON API format (for frontend)
   */
  toAPIFormat() {
    return {
      meta: {
        generatedAt: new Date().toISOString(),
        totalVenues: this.venues.length,
        totalEvents: this.allEvents.length,
        dateRange: {
          start: this.allEvents[0]?.date.start.toISOString(),
          end: this.allEvents[this.allEvents.length - 1]?.date.start.toISOString(),
        },
      },
      events: this.allEvents.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date.start.toISOString(),
        time: event.date.startTime,
        venue: {
          name: event.venue.name,
          address: event.venue.address,
        },
        url: event.source.url,
        artists: event.artists,
      })),
    };
  }

  // ---- Utility methods ----

  private formatICalDateTime(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }
}
