import * as fs from "fs";
import * as path from "path";
import { CalendarCoordinator } from "./coordinator";
import { MUSIC_MILE_VENUES } from "./venues.config";

/**
 * Music Mile Calendar - Main Entry Point
 * Fetches all events and exports to multiple formats
 * Usage: npm run build && node dist/index.js
 */

async function main() {
  console.log("\n🎵 ========================================");
  console.log("   MUSIC MILE CALENDAR GENERATOR");
  console.log("========================================\n");

  // Initialize coordinator with all venues
  const coordinator = new CalendarCoordinator(MUSIC_MILE_VENUES);

  try {
    // Fetch all events from all sources
    const calendar = await coordinator.fetchAllEvents();

    console.log("\n✅ Event collection complete!\n");

    // Create output directory
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export 1: JSON Format (for API/storage)
    const jsonPath = path.join(outputDir, "calendar.json");
    fs.writeFileSync(jsonPath, coordinator.toJSON());
    console.log(`📄 JSON export: ${jsonPath}`);

    // Export 2: iCalendar Format (.ics file)
    const icsPath = path.join(outputDir, "music-mile.ics");
    fs.writeFileSync(icsPath, coordinator.toICalendar());
    console.log(`📅 iCalendar export: ${icsPath}`);
    console.log(`   ↳ Subscribe in Apple Calendar, Google Calendar, Outlook, etc.`);

    // Export 3: API-friendly JSON (compact format for frontend)
    const apiPath = path.join(outputDir, "api.json");
    fs.writeFileSync(apiPath, JSON.stringify(coordinator.toAPIFormat(), null, 2));
    console.log(`🔗 API export: ${apiPath}`);

    // Summary stats
    console.log("\n📊 Summary:");
    console.log(`   Venues scanned: ${calendar.venueCount}`);
    console.log(`   Total events: ${calendar.eventCount}`);

    if (calendar.events.length > 0) {
      const dates = calendar.events.map((e) => e.date.start);
      const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
      const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

      console.log(`   Date range: ${earliest.toDateString()} to ${latest.toDateString()}`);

      // Count by venue
      const byVenue: Record<string, number> = {};
      calendar.events.forEach((e) => {
        byVenue[e.venue.name] = (byVenue[e.venue.name] || 0) + 1;
      });

      console.log("\n   Events by venue:");
      Object.entries(byVenue)
        .sort((a, b) => b[1] - a[1])
        .forEach(([venue, count]) => {
          console.log(`      ${venue}: ${count}`);
        });
    }

    console.log("\n✨ Done! Calendar ready to use.\n");
  } catch (error) {
    console.error("\n❌ Error during execution:");
    console.error(error);
    process.exit(1);
  }
}

main();
