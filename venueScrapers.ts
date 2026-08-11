import { load } from "cheerio";
import { MusicEvent, Venue } from "../types";

/**
 * Web scrapers for Music Mile venues without APIs
 * Each venue has a custom selector strategy based on their HTML structure
 */

interface ScraperConfig {
  url: string;
  selectors: {
    eventContainer: string; // Parent element for each event
    title?: string; // Event title/heading
    date?: string; // Date element
    time?: string; // Time element
    description?: string; // Event description
    link?: string; // Event link
  };
  dateParser?: (dateStr: string) => Date | null;
}

async function fetchHTML(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    } as RequestInit);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Ironwood Stage & Grill
 * Website: ironwoodstage.ca/events/
 */
export async function scrapeIronwood(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML("https://ironwoodstage.ca/events/");
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Target event divs (inspect the website to refine)
  $(".event, .show, [data-event]").each((_, el) => {
    const $el = $(el);

    // Extract data - adjust selectors based on actual HTML structure
    const title = $el.find(".event-title, h3, .title").text().trim();
    const dateText = $el.find(".event-date, .date, time").text().trim();
    const timeText = $el.find(".event-time, .time").text().trim();
    const linkEl = $el.find("a[href*='event']").first();
    const link = linkEl.attr("href") || "";

    if (!title || !dateText) return; // Skip incomplete entries

    // Parse date (adjust parsing logic for actual date format)
    const dateMatch = dateText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2},? \d{4}/);
    const parsedDate = dateMatch ? new Date(dateMatch[0]) : null;

    if (!parsedDate || isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: {
        start: parsedDate,
        startTime: timeText || undefined,
      },
      source: {
        platform: "scraped",
        url: link || venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}

/**
 * Festival Hall
 * Website: calgaryfolkfest.com/festival-hall/
 */
export async function scrapeFestivalHall(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML("https://www.calgaryfolkfest.com/festival-hall/");
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Common event listing patterns
  $(".event-item, .show-listing, tr[data-event]").each((_, el) => {
    const $el = $(el);

    const title = $el
      .find(".event-name, .show-title, td:nth-child(1)")
      .text()
      .trim();
    const dateText = $el
      .find(".event-date, .date, time, td:nth-child(2)")
      .text()
      .trim();

    if (!title || !dateText) return;

    const parsedDate = new Date(dateText);
    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: { start: parsedDate },
      source: {
        platform: "scraped",
        url: venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}

/**
 * The Hose & Hound
 * Website: thehose.ca
 */
export async function scrapeHoseAndHound(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML("https://www.thehose.ca/");
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Look for upcoming shows section
  $("[class*='event'], [class*='show'], .upcoming").each((_, el) => {
    const $el = $(el);
    const title = $el.find("h3, h4, .title").text().trim();
    const dateText = $el.find(".date, time").text().trim();

    if (!title || !dateText) return;

    const parsedDate = new Date(dateText);
    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: { start: parsedDate },
      source: {
        platform: "scraped",
        url: venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}

/**
 * The Attic
 * Website: theatticYYC.ca
 */
export async function scrapeTheAttic(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML("https://www.theatticYYC.ca/");
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Extract events from calendar or events section
  $("[data-event], .event, .calendar-event").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".event-title, h3").text().trim();
    const dateText = $el.find("[data-date], .date, time").attr("datetime") ||
      $el.find(".date").text().trim();

    if (!title || !dateText) return;

    const parsedDate = new Date(dateText);
    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: { start: parsedDate },
      source: {
        platform: "scraped",
        url: venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}

/**
 * Gravity Espresso & Wine Bar
 * Website: cafegravity.com
 */
export async function scrapeGravity(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML("https://www.cafegravity.com/");
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  $(".event-listing, [class*='show']").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".event-name, h3").text().trim();
    const dateText = $el.find(".event-date, [data-date]").text().trim();

    if (!title || !dateText) return;

    const parsedDate = new Date(dateText);
    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: { start: parsedDate },
      source: {
        platform: "scraped",
        url: venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}

/**
 * Generic scraper for venues with standard HTML patterns
 * Falls back to common selectors if specific scrapers unavailable
 */
export async function genericScraper(
  venue: Venue,
  config?: Partial<ScraperConfig>
): Promise<MusicEvent[]> {
  const html = await fetchHTML(venue.website);
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Default selectors - adjust based on venue structure
  const selectors = {
    eventContainer: config?.selectors?.eventContainer || ".event, [data-event], .show",
    title: config?.selectors?.title || ".title, h3, .event-name",
    date: config?.selectors?.date || ".date, [data-date], time",
    ...config?.selectors,
  };

  $(selectors.eventContainer).each((_, el) => {
    const $el = $(el);

    const title = $el.find(selectors.title).first().text().trim();
    const dateText = $el.find(selectors.date).first().text().trim();

    if (!title || !dateText) return;

    let parsedDate = new Date(dateText);

    // If parsing failed, try custom parser
    if (isNaN(parsedDate.getTime()) && config?.dateParser) {
      const customDate = config.dateParser(dateText);
      if (!customDate) return;
      parsedDate = customDate;
    }

    if (isNaN(parsedDate.getTime())) return;

    events.push({
      id: `${venue.slug}_scraped_${Date.now()}_${Math.random()}`,
      title,
      venue,
      date: { start: parsedDate },
      source: {
        platform: "scraped",
        url: venue.website,
        lastUpdated: new Date(),
      },
    });
  });

  return events;
}
