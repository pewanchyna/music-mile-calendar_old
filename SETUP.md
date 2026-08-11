# Music Mile Calendar - Setup Guide

Complete walk-through for getting the system running locally, testing, and deploying.

## Step 1: Local Development Setup (10 minutes)

### 1.1 Clone/Create Project
```bash
mkdir music-mile-calendar
cd music-mile-calendar
git init
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Copy Environment Template
```bash
cp .env.example .env
```

Leave `.env` blank for now (Bandsintown works without keys).

### 1.4 Test Run
```bash
npm run dev
```

You should see output like:
```
🎵 ========================================
   MUSIC MILE CALENDAR GENERATOR
========================================

Fetching events for 13 venues...
✓ Ironwood Stage & Grill: 12 events
✓ King Eddy: 8 events
✓ Studio Bell: 5 events
...

📊 Summary:
   Venues scanned: 13
   Total events: 45
   Date range: Aug 15, 2024 to Dec 31, 2024
```

Check `output/` folder — should have three files:
- `calendar.json`
- `music-mile.ics`
- `api.json`

✅ **Congrats!** The scraper works locally.

---

## Step 2: Add Eventbrite Events (Optional, 5 minutes)

If you want to include Studio Bell and The Attic via Eventbrite:

### 2.1 Get Eventbrite API Key
1. Go to https://www.eventbrite.com/api
2. Sign in (create account if needed)
3. Create a Personal Access Token
4. Copy the token

### 2.2 Find Organization IDs
For each venue you want to add:
1. Go to their Eventbrite page (e.g., https://www.eventbrite.ca/o/studio-bell)
2. Look in the URL or inspect the page to find the organization ID
3. Update `src/venues.config.ts`:

```typescript
{
  name: "Studio Bell",
  dataSource: {
    method: "eventbrite",
    identifier: "12345678", // Replace with actual org ID
  },
}
```

### 2.3 Update .env
```bash
# .env
EVENTBRITE_API_KEY=your_personal_access_token_here
```

### 2.4 Test
```bash
npm run dev
```

Should now include Eventbrite events. Check `output/api.json` for new events.

---

## Step 3: Improve Web Scrapers (20 minutes per venue)

The generic scrapers may need tuning for specific venues. Here's how:

### 3.1 Inspect a Venue's Website
Open the venue's website in your browser:
```
https://ironwoodstage.ca/events/
```

### 3.2 Find the Event HTML
1. Right-click an event → Inspect
2. Look for patterns in the HTML:
   - Event container: `<div class="event">`, `<li data-event>`, `<tr class="show">`, etc.
   - Event title: Often in `<h3>`, `<a>`, or `.event-name`
   - Event date: Often in `<time>`, `datetime` attribute, or `.date` class

### 3.3 Update the Scraper

In `src/scrapers/venueScrapers.ts`, update the selectors:

```typescript
export async function scrapeMyVenue(venue: Venue): Promise<MusicEvent[]> {
  const html = await fetchHTML(venue.website);
  if (!html) return [];

  const $ = load(html);
  const events: MusicEvent[] = [];

  // Update these selectors based on what you found in Step 3.2
  $(".events .event-item").each((_, el) => {
    const $el = $(el);

    // Adjust these selectors:
    const title = $el.find("h3.event-title").text().trim();
    const dateText = $el.find("time").attr("datetime");
    
    // ... rest of event creation
  });

  return events;
}
```

### 3.4 Test the Scraper
```bash
npm run dev
```

Check `output/api.json` and search for your venue — should have updated events.

---

## Step 4: Deploy to GitHub (for automation)

### 4.1 Create GitHub Repo
1. Go to https://github.com/new
2. Name: `music-mile-calendar`
3. Make it **public** (so your calendar is accessible)
4. Click Create

### 4.2 Push Code to GitHub
```bash
git add .
git commit -m "Initial commit: Music Mile Calendar system"
git remote add origin https://github.com/YOUR_USERNAME/music-mile-calendar.git
git branch -M main
git push -u origin main
```

### 4.3 Add API Key to GitHub Secrets
1. Go to repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `EVENTBRITE_API_KEY`
4. Value: Paste your Eventbrite API key
5. Click **Add secret**

### 4.4 Create GitHub Actions Workflow

Create `.github/workflows/sync.yml`:

```yaml
name: Update Music Mile Calendar

on:
  schedule:
    # Run every Monday at 8 AM UTC (3 AM MDT Calgary time)
    - cron: "0 8 * * 1"
  # Allow manual trigger from Actions tab
  workflow_dispatch:

jobs:
  update:
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

      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "Calendar Bot"
          git add output/
          git diff --quiet && git diff --staged --quiet || (
            git commit -m "chore: update Music Mile calendar [$(date -u +'%Y-%m-%d')]"
            git push
          )
```

Push this workflow file:
```bash
git add .github/
git commit -m "Add GitHub Actions workflow"
git push
```

### 4.5 Test the Workflow

1. Go to repo → **Actions** tab
2. Click "Update Music Mile Calendar"
3. Click **Run workflow**
4. Wait ~30 seconds, check for green checkmark
5. Go to `output/` folder on GitHub — should see updated files with new timestamp

✅ **Automation is now live!** Calendar will update every Monday at 8 AM UTC.

---

## Step 5: Host the Calendar on the Web (15 minutes)

### Option A: GitHub Pages (Free, Simple)

1. Go to repo → **Settings** → **Pages**
2. Under "Source", select **Deploy from a branch**
3. Branch: `main`, Folder: `/ (root)`
4. Click **Save**
5. Wait ~2 minutes, refresh the page
6. Your calendar is now at: `https://YOUR_USERNAME.github.io/music-mile-calendar/`

To access the feeds:
- **iCalendar**: `https://YOUR_USERNAME.github.io/music-mile-calendar/output/music-mile.ics`
- **JSON API**: `https://YOUR_USERNAME.github.io/music-mile-calendar/output/api.json`
- **Full Data**: `https://YOUR_USERNAME.github.io/music-mile-calendar/output/calendar.json`

### Option B: Vercel/Netlify (Free, with custom domain)

#### Vercel:
1. Go to https://vercel.com/new
2. Import GitHub repo
3. Deploy
4. Custom domain setup in Vercel dashboard

#### Netlify:
1. Go to https://app.netlify.com/start
2. Connect GitHub
3. Select your repo
4. Deploy

Both will auto-deploy when you push to `main`.

### Option C: Self-hosted VPS
Upload `output/` files to your web server via SCP/FTP:
```bash
scp -r output/ user@your-server.com:/var/www/music-calendar/
```

---

## Step 6: Integrate into Your Website

### 6.1 Embed iCalendar (Simple)
```html
<!-- Users can click to subscribe in their calendar app -->
<a href="https://YOUR_SITE.com/output/music-mile.ics">
  Subscribe to Music Mile Calendar
</a>
```

Or embed a Google Calendar:
```html
<iframe src="https://calendar.google.com/calendar/embed?src=https://YOUR_SITE.com/output/music-mile.ics" 
        style="border: 0;" width="800" height="600" frameborder="0" scrolling="no"></iframe>
```

### 6.2 Display Events as a List (JavaScript)
```javascript
// Fetch and display events
fetch('https://YOUR_SITE.com/output/api.json')
  .then(r => r.json())
  .then(data => {
    const html = data.events
      .slice(0, 10) // Show first 10 upcoming events
      .map(e => `
        <div class="event">
          <h3>${e.title}</h3>
          <p>${e.venue.name}</p>
          <p>${new Date(e.date).toLocaleDateString()} at ${e.time}</p>
          <a href="${e.url}">Details</a>
        </div>
      `)
      .join('');
    
    document.getElementById('events-container').innerHTML = html;
  });
```

### 6.3 React Calendar Component
```javascript
import { useEffect, useState } from 'react';

export function MusicCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('https://YOUR_SITE.com/output/api.json')
      .then(r => r.json())
      .then(data => setEvents(data.events));
  }, []);

  return (
    <div>
      <h2>Upcoming Shows</h2>
      {events.map(e => (
        <div key={e.id}>
          <h3>{e.title} @ {e.venue.name}</h3>
          <p>{new Date(e.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Step 7: Maintenance & Monitoring

### Weekly Checks
- GitHub Actions should run every Monday
- Check repo for new commit with updated calendar
- If no update, check **Actions** tab for errors

### Monthly Scraper Tune-ups
- If venues redesign their websites, update selectors
- Test by running `npm run dev` locally
- Commit improvements to GitHub

### Update Venue List
- Add new venues to `src/venues.config.ts`
- Remove inactive venues
- Update venue contact info as needed

### Monitor Data Quality
- Check `output/api.json` for any anomalies
- Verify event dates make sense
- Look for duplicate events

---

## Troubleshooting

### GitHub Actions Failing?

1. Go to **Actions** → Latest run
2. Click on the failed step for logs
3. Common issues:
   - **API key error**: Check GitHub Secrets (Step 4.3)
   - **Network timeout**: Venues may be down; wait and retry
   - **Date parse error**: Update scrapers (Step 3)

### No events showing up?

1. Run locally: `npm run dev`
2. Check `output/calendar.json` for data
3. If empty:
   - Try individual venues in a browser
   - Verify selectors in scrapers
   - Check network requests in browser DevTools

### iCalendar not subscribing?

- Ensure `.ics` file is accessible (test in browser)
- Make sure HTTPS is enabled (most calendar apps require it)
- Try importing instead of subscribing:
  - Download `.ics` → Open with Calendar app → "Add to Calendar"

---

## Next Steps

1. ✅ Run locally
2. ✅ Deploy to GitHub
3. ✅ Set up automation
4. ✅ Host on the web
5. ✅ Integrate into your website
6. **Now**: Promote the calendar!

Share the links:
- iCalendar (for subscriptions): `https://YOUR_SITE.com/output/music-mile.ics`
- Calendar page: `https://YOUR_USERNAME.github.io/music-mile-calendar/`

---

## Support

Got stuck? Check:
1. README.md — General overview
2. This file — Step-by-step setup
3. Source code comments — Implementation details
4. GitHub Issues — Report bugs or ask questions

Happy calendar-making! 🎵
