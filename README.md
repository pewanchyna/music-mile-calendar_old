# 🎵 Music Mile Calendar

An automated system to scrape and aggregate live music events from Calgary's Music Mile venues into a unified, live-updating calendar.

## Architecture

```
Music Mile Venues (APIs + Websites)
         ↓
  Data Collectors
  ├── Bandsintown API (Ironwood, King Eddy)
  ├── Eventbrite API (Studio Bell, The Attic)
  └── Web Scrapers (Other venues)
         ↓
  Unified Data Schema
         ↓
  Calendar Coordinator (Deduplication + Normalization)
         ↓
  Export Formats
  ├── JSON (API/Storage)
  ├── iCalendar (.ics)
  └── Compact JSON (Frontend)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Keys

#### Eventbrite (Optional)
If you want to fetch events from Studio Bell or The Attic via Eventbrite:

1. Go to https://www.eventbrite.com/api/
2. Create a personal access token
3. Set environment variable:
   ```bash
   export EVENTBRITE_API_KEY="your_api_key_here"
   ```

#### Update Venue Config
In `src/venues.config.ts`, replace placeholder Eventbrite org IDs:
```typescript
{
  name: "Studio Bell",
  dataSource: {
    method: "eventbrite",
    identifier: "YOUR_STUDIO_BELL_ORG_ID", // Get from Studio Bell's eventbrite page
  },
}
```

### 3. Run the Calendar Generator

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

### 4. Output Files

The script generates three export formats in the `output/` directory:

```
output/
├── calendar.json          # Full event data + metadata
├── music-mile.ics         # iCalendar feed (import to any calendar app)
└── api.json               # Compact format for frontend
```

## Export Formats

### JSON (`calendar.json`)
```json
{
  "updatedAt": "2024-08-10T...",
  "venueCount": 20,
  "eventCount": 45,
  "events": [
    {
      "id": "ironwood-stage-grill_bandsintown_123",
      "title": "The Sadies",
      "venue": {
        "name": "Ironwood Stage & Grill",
        "address": "1229 9 Ave SE",
        "phone": "403-269-5581"
      },
      "date": {
        "start": "2024-08-15T19:00:00.000Z",
        "startTime": "19:00"
      },
      "artists": ["The Sadies"],
      "source": {
        "platform": "bandsintown",
        "url": "https://www.bandsintown.com/e/..."
      }
    }
  ]
}
```

### iCalendar (`.ics`)
- Import directly into Apple Calendar, Google Calendar, Outlook, etc.
- Subscribe to the `.ics` feed for live updates
- Standard format compatible with all calendar apps

### API Format (`api.json`)
```json
{
  "meta": {
    "generatedAt": "2024-08-10T...",
    "totalVenues": 20,
    "totalEvents": 45,
    "dateRange": {
      "start": "2024-08-15T...",
      "end": "2024-12-31T..."
    }
  },
  "events": [
    {
      "id": "ironwood-stage-grill_bandsintown_123",
      "title": "The Sadies",
      "date": "2024-08-15T19:00:00.000Z",
      "time": "19:00",
      "venue": {
        "name": "Ironwood Stage & Grill",
        "address": "1229 9 Ave SE"
      },
      "url": "https://www.bandsintown.com/e/...",
      "artists": ["The Sadies"]
    }
  ]
}
```

## Automation with GitHub Actions

### Set Up Weekly Scraping

Create `.github/workflows/calendar-sync.yml`:

```yaml
name: Sync Music Mile Calendar

on:
  schedule:
    # Run every Monday at 8 AM UTC
    - cron: "0 8 * * 1"
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build TypeScript
        run: npm run build

      - name: Generate calendar
        env:
          EVENTBRITE_API_KEY: ${{ secrets.EVENTBRITE_API_KEY }}
        run: npm start

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "Calendar Bot"
          git add output/
          git commit -m "Update Music Mile calendar - $(date -u +'%Y-%m-%d %H:%M:%S')" || echo "No changes"
          git push
```

### Store API Key Securely

1. Go to repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `EVENTBRITE_API_KEY`
4. Value: Your Eventbrite API key

## Adding New Venues

### For API-based venues:

1. Add to `src/venues.config.ts`:
```typescript
{
  name: "New Venue",
  slug: "new-venue",
  address: "...",
  website: "...",
  dataSource: {
    method: "bandsintown", // or "eventbrite"
    identifier: "optional_org_id",
  },
}
```

### For venues requiring scraping:

1. Create a new scraper in `src/scrapers/venueScrapers.ts`:
```typescript
export async function scrapeNewVenue(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML(venue.website);
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Extract events using Cheerio selectors
  // ...

  return events;
}
```

2. Add route in `coordinator.ts`:
```typescript
if (slug.includes("new-venue")) return scrapeNewVenue(venue);
```

## Data Normalization

All events are normalized to this schema:

```typescript
interface MusicEvent {
  id: string;
  title: string;
  venue: Venue;
  date: {
    start: Date;
    end?: Date;
    startTime?: string;
  };
  artists?: string[];
  description?: string;
  ticketInfo?: {
    url?: string;
    price?: string;
    isFree?: boolean;
  };
  source: {
    platform: "bandsintown" | "eventbrite" | "scraped";
    url: string;
    lastUpdated: Date;
  };
}
```

This ensures all data, regardless of source, fits a consistent structure.

## Hosting the Calendar

### Option 1: GitHub Pages

1. Add `output/` files to a `gh-pages` branch
2. Enable GitHub Pages in Settings → Pages
3. Calendar available at: `https://yourusername.github.io/music-mile-calendar/`

### Option 2: Host on a Website

1. Upload `output/calendar.json` and `output/music-mile.ics` to your web server
2. Update your website to fetch from these endpoints
3. Render using a calendar library (see Frontend Examples below)

## Frontend Integration Examples

### Embed iCalendar Feed
```html
<!-- Google Calendar -->
<iframe src="https://calendar.google.com/calendar/embed?src=YOUR_ICS_URL"></iframe>

<!-- Apple Calendar (macOS/iOS) -->
<!-- Users can subscribe: Calendar → File → Subscribe → Paste ICS URL -->
```

### React Component
```javascript
import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

export default function MusicCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('https://yoursite.com/output/api.json')
      .then(r => r.json())
      .then(data => {
        setEvents(data.events.map(e => ({
          title: e.title,
          start: e.date,
          venue: e.venue.name,
        })));
      });
  }, []);

  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={events}
    />
  );
}
```

## Troubleshooting

### "No events found for venue X"

- Check if website structure changed (HTML selectors may need updating)
- Verify venue is reachable: `curl https://venue-website.com`
- Check browser console for CORS errors if fetching from frontend

### Eventbrite API errors

- Ensure API key is valid: `echo $EVENTBRITE_API_KEY`
- Verify org ID is correct (check venue's Eventbrite page URL)
- Check API rate limits (15 requests/second for Eventbrite)

### Duplicate events

- Events are deduplicated by: venue + normalized title + date
- If duplicates persist, check `date` parsing logic

### Events missing from iCalendar

- Verify dates are valid (not in past or too far future)
- Check iCal format compliance in coordinator.ts

## Development

### Run tests
```bash
npm test
```

### Run in dev mode with hot reload
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

## Project Structure

```
music-mile-calendar/
├── src/
│   ├── types.ts               # TypeScript interfaces
│   ├── coordinator.ts         # Main orchestrator
│   ├── venues.config.ts       # Venue definitions
│   ├── index.ts               # Entry point
│   ├── apis/
│   │   ├── bandsintown.ts     # Bandsintown API client
│   │   └── eventbrite.ts      # Eventbrite API client
│   └── scrapers/
│       └── venueScrapers.ts   # HTML scrapers
├── output/                    # Generated files (JSON, iCal)
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Found a bug or want to add a venue? Submit an issue or PR!

## License

MIT

## Resources

- [Bandsintown API Docs](https://www.bandsintown.com/api/overview)
- [Eventbrite API Docs](https://www.eventbrite.com/api/v3/)
- [iCalendar Format (RFC 5545)](https://tools.ietf.org/html/rfc5545)
- [Cheerio (HTML Parsing)](https://cheerio.js.org/)
- [Music Mile Website](https://www.musicmile.ca/)
