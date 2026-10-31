# Digital wedding invitation

A responsive Next.js App Router invitation with TypeScript, an ivory/olive botanical design, and Indonesian copy.

## Run

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open a guest link such as http://localhost:3000/iwed/adam-gray. The home page, links without the `/iwed` prefix, and unknown slugs show a 404 page. Use `npm run build` for a production build and `npm start` to serve it. `npm run typecheck` checks TypeScript.

## Customize

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. In the GitHub repository, select **Settings → Pages → Source → GitHub Actions** before the first run. The app defaults to the `/iwed` URL prefix in development and normal production builds. For GitHub Pages, the workflow uses the hosting base path reported by Pages (normally `/iwed` for this repository) for routes, scripts, styles, and music. This prefix is applied once, so guest links stay `/iwed/adam-gray/`. A different repository or a custom domain uses its own Pages hosting base path.

To check the Pages export locally in PowerShell:

```powershell
$env:GITHUB_PAGES = "true"
$env:PAGES_BASE_PATH = "/iwed"
npm.cmd run build
Remove-Item Env:GITHUB_PAGES
Remove-Item Env:PAGES_BASE_PATH
```

The deployable files are generated in `out/`. Normal `npm.cmd run dev` and `npm.cmd start` still use Next.js when these variables are unset.

Guest messages work on GitHub Pages: the browser reads and writes directly to Supabase. The workflow includes this invitation's public Supabase URL and publishable key. To use another project, set the repository Actions variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then rebuild. These values are public browser configuration, as described in [Supabase's API key guide](https://supabase.com/docs/guides/getting-started/api-keys); never use a secret key, service-role key, or database password in them.

## Guest messages

The bottom of the invitation includes name and message fields and a public list of wishes. Personalized invitation links prefill the guest's name, which remains editable. Names are limited to 80 characters and messages to 1000 characters. The browser trims and validates both fields, and Postgres also enforces nonblank text and length limits. Supabase assigns IDs and timestamps and persists submissions independently of the website host. Messages appear newest first, with 20 per page and a button to load older wishes. Failed requests show retry feedback and preserve the message draft.

Copy `.env.example` to `.env.local` for local development (`Copy-Item .env.example .env.local` in PowerShell). The example already contains this project's public configuration. Environment files are ignored by Git except `.env.example`. Only the URL and publishable key are needed by the app; database credentials are never sent to guests. Next.js embeds these public variables at build time, so rebuild after changing projects.

The Supabase CLI is installed as a development dependency. To connect a fresh checkout and apply pending migrations:

```sh
npx supabase login
npx supabase link --project-ref lwppzttwyhajtrmhozgg
npx supabase db push --linked
```

`supabase/` is already initialized. The migration in `supabase/migrations/` creates `public.guest_messages`, the sorting index, and Row Level Security policies. Signed-out and signed-in guests may read wishes and insert only `name` and `message`; they cannot edit, delete, truncate, or supply IDs/timestamps. Manage or remove messages as the project owner in the Supabase Dashboard's Table Editor. All wishes and guest names are public.

Run `npm run test:messages` for client validation, Supabase requests, pagination, and error-handling tests; these mock the network and do not modify the live guestbook. `npm run test:db` runs 30 database assertions against the linked project inside a rolled-back transaction (requires Docker for Supabase's pgTAP runner). Without Docker, `npx supabase db query --linked --file supabase/tests/guest_messages.test.sql` executes the same assertions through the Management API; a successful result ends with `1..30` and no failure diagnostics. Neither database test method leaves test wishes behind.

## Invitation content

All sample wedding content is in `data/wedding.json`: couple names and parents, guest fallback, date, time zone, akad/resepsi start and end times, venue, full address, map query, story years and descriptions, and invitation copy. Names, initials, page title, countdown, dates, and calendar downloads derive from this data. Keep ISO timestamps with an explicit UTC offset and update `timeZone` and `timeZoneLabel` consistently.

### Personalized guest links

Edit `data/guests.json` to list your guests. The included John/Jane entries are examples; replace them with your actual guests:

```json
[
  { "slug": "john-doe", "name": "John Doe", "partySize": 2 },
  { "slug": "jane-doe", "name": "Jane Doe", "partySize": 1 }
]
```

Share `https://your-domain.com/iwed/john-doe/` for John or `/iwed/jane-doe/` for Jane. On this repository's GitHub Pages deployment, the link has the same prefix: `https://your-account.github.io/iwed/john-doe/`. Each page displays the guest's name. The `partySize` is kept in the guest list for planning (including the named guest) and is not displayed on the invitation.

Slugs must be unique, lowercase letters/numbers separated by hyphens. Names must not be empty, and `partySize` must be a positive integer. Invalid entries fail the build. Guests with the same name can use different slugs such as `john-doe-1` and `john-doe-2`.

Guest pages are generated at build time, so rebuild and redeploy after editing the list. Only slugs in `data/guests.json`, under the URL prefix, open an invitation. The `/` and `/iwed/` pages, legacy `?kpd=...` links without a valid guest path, bare `/adam-gray` links, and unknown slugs show a 404 page without rendering the invitation. Query parameters cannot grant access or override a named guest page. The invitation component requires a recipient and has no generic greeting fallback.

Access is based on knowing a valid guest link, not authentication or RSVP enforcement: anyone with a valid link can open and share it. Pages request `noindex, nofollow` from search engines, and the browser's referrer policy is `no-referrer`. The guest list stays out of the shared client JavaScript. Static assets and the Supabase guestbook remain public; use server-side authentication if those also need restricted access.

### Background music

The player is ready for your chosen audio file. Add an MP3 you have permission to use at `public/audio/wedding.mp3`, then set `music.src` in `data/wedding.json` to `/audio/wedding.mp3`. Keep the path relative to `public`, starting with `/`; the GitHub Pages base path is added automatically. Rebuild and redeploy after adding or replacing the file. An empty `music.src` disables the player and makes no audio requests; no sample song is bundled.

Music begins when the guest taps **Buka Undangan**, loops while they browse, and can be paused or resumed with the floating button. It downloads only when playback is requested. The control sits above the bottom navigation on mobile. If playback is blocked or the file fails to load, the invitation stays usable and the button lets guests retry. Set `music.volume` between `0` and `1` (default `0.35`); some mobile browsers use the device volume instead.

Set `music.startAt` to the starting position in seconds, for example `131` for **2:11** (the current setting), or `0` to play from the beginning. The song starts there on opening and on every loop. Pausing and resuming keeps the current position. Negative values use `0`; a cue at or beyond the song's duration also falls back to the beginning. For example, after adding the file:

```json
"music": {
  "src": "/audio/wedding.mp3",
  "volume": 0.35,
  "startAt": 131
}
```

The venue and address are fictional placeholders. The map currently shows the Menteng area; change `venue.mapQuery` to the real venue or coordinates and update the note when ready. The embedded Google map and external Google Maps link require no API key. Maps and Google Fonts need internet access; system font fallbacks are provided. Decorative illustrations are local SVG components, with no photo dependencies.

The calendar button downloads both events as an `.ics` file. Address copying uses the browser clipboard API (HTTPS or localhost), with manual-copy feedback if unavailable. Guest wishes use Supabase as described above; RSVP submission, payments, and tracking are not included.
