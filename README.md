# Digital wedding invitation

A responsive Next.js App Router invitation with TypeScript, an ivory/olive botanical design, and Indonesian copy.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build` for a production build and `npm start` to serve it. `npm run typecheck` checks TypeScript.

## Customize

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. In the GitHub repository, select **Settings → Pages → Source → GitHub Actions** before the first run. The workflow derives the URL base path from GitHub Pages, so scripts and styles work under a repository URL such as `/iwed/`.

To check the Pages export locally in PowerShell:

```powershell
$env:GITHUB_PAGES = "true"
$env:PAGES_BASE_PATH = "/iwed"
npm.cmd run build
Remove-Item Env:GITHUB_PAGES
Remove-Item Env:PAGES_BASE_PATH
```

The deployable files are generated in `out/`. Normal `npm.cmd run dev` and `npm.cmd start` still use Next.js when these variables are unset.

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

Share `https://your-domain.com/john-doe/` for John or `/jane-doe/` for Jane. On GitHub Pages with a repository base path, include it: `https://your-account.github.io/iwed/john-doe/`. Each page displays the guest's name. The `partySize` is kept in the guest list for planning (including the named guest) and is not displayed on the invitation.

Slugs must be unique, lowercase letters/numbers separated by hyphens. Names must not be empty, and `partySize` must be a positive integer. Invalid entries fail the build. Guests with the same name can use different slugs such as `john-doe-1` and `john-doe-2`.

Guest pages are generated at build time, so rebuild and redeploy after editing the list. Unknown slugs return 404. The main `/` page keeps the generic greeting and still supports the legacy `/?kpd=Bapak%20Budi` greeting; query parameters cannot override a named guest page.

These are shareable personalized invitations, not authenticated access or RSVP enforcement. Anyone with a link can open it. The guest list stays out of the shared client JavaScript, but each generated guest page is public.

The venue and address are fictional placeholders. The map currently shows the Menteng area; change `venue.mapQuery` to the real venue or coordinates and update the note when ready. The embedded Google map and external Google Maps link require no API key. Maps and Google Fonts need internet access; system font fallbacks are provided. Decorative illustrations are local SVG components, with no photo dependencies.

The calendar button downloads both events as an `.ics` file. Address copying uses the browser clipboard API (HTTPS or localhost), with manual-copy feedback if unavailable. No RSVP submission, payments, tracking, or backend storage is included.
