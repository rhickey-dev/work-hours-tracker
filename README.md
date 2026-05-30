# Work Hours Tracker

A simple, private web app for tracking your daily work hours and pay. It runs
entirely in your browser — no accounts, no servers, and nothing is ever sent
anywhere. Your data is saved on your own device using the browser's
`localStorage`.

## Features

- **Log a work day** — date, optional job site, start/end times, and an
  optional break.
- **Live hours** — see the calculated hours for the day as you type.
- **Hourly rate & pay** — enter a rate (which can differ per job site) and the
  app works out the pay owed.
- **Running totals** — total hours and pay across every saved day, plus a
  per–job-site breakdown.
- **Edit & delete** — change or remove any saved day, with a confirmation step.
- **PDF timesheet** — download (or share, on supported devices) a formatted
  landscape PDF of all entries. The PDF is always generated in English.
- **English / Spanish** — switch the interface language at any time.
- **Works offline & on phones** — responsive layout; the table collapses into
  readable cards on small screens.

## How to use

1. Open `index.html` in your browser (double-click it, or drag it into a
   browser window).
2. Enter your name (it appears at the top of the PDF), then fill in a work day.
3. Press **Save this day** to add it to the table and update your totals.
4. Use **Download PDF** to export a timesheet of everything you've logged.

## Project structure

| File         | Purpose                                                      |
| ------------ | ----------------------------------------------------------- |
| `index.html` | Page markup and structure.                                  |
| `styles.css` | All styling (responsive, accessible, light theme).          |
| `app.js`     | All logic: calculations, storage, rendering, i18n, and PDF. |

There is no build step — the files are plain HTML, CSS, and JavaScript.
