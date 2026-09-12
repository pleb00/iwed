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

Personalize the greeting with `/?kpd=Bapak%20Budi`. React safely renders the guest name as text.

The venue and address are fictional placeholders. The map currently shows the Menteng area; change `venue.mapQuery` to the real venue or coordinates and update the note when ready. The embedded Google map and external Google Maps link require no API key. Maps and Google Fonts need internet access; system font fallbacks are provided. Decorative illustrations are local SVG components, with no photo dependencies.

The calendar button downloads both events as an `.ics` file. Address copying uses the browser clipboard API (HTTPS or localhost), with manual-copy feedback if unavailable. No RSVP submission, payments, tracking, or backend storage is included.
