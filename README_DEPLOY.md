# Family Fit Coach V2 - GitHub Pages Drop-in

This folder is designed to be dropped into your existing GitHub Pages repo.

## Fast deploy

1. Back up your current `index.html`.
2. Replace it with the `index.html` in this folder.
3. Commit and push to GitHub.
4. In GitHub, open repository Settings -> Pages.
5. Set Source to "Deploy from a branch".
6. Set Branch to `main` and Folder to `/root` unless your repo uses `/docs`.
7. Save and wait for the Pages deployment to finish.

GitHub Pages expects an `index.html`, `index.md`, or `README.md` at the top level of the selected publishing source. This app is a single-file `index.html`, so no build system is required.

## What is included

- 91-exercise custom library for the dual-arm functional trainer, bench, attachments, bodyweight, ball, and dumbbells.
- Profile system for adults, youth, guests, and family members.
- Readiness and soreness checks.
- Smart daily plan generator that rotates focus areas and avoids same-session repeats.
- Youth-safe mode with lighter/bodyweight/athletic-biased programming.
- Set logging, RPE, rest timer, session history, volume totals, and progression suggestions.
- Setup cards with functional trainer height / angle / lever guidance and simple machine visuals.
- Exercise library screen with search/filter.
- AI Coach Export screen that creates a context package for ChatGPT or a future backend AI feature.

## Current privacy and AI note

The app stores data locally in the browser with localStorage. Do not paste API keys into a public GitHub Pages file. For live in-app AI later, add a private serverless endpoint and call that endpoint from the app.

## Next high-impact upgrades

1. Add real exercise demo videos or GIFs for the exact machine setup.
2. Add a small backend for shared family accounts and true AI coaching.
3. Add calendar planning and multi-week periodization blocks.
4. Add QR codes on attachments or machine arms to jump to setup pages.
5. Add a quick calibration flow for your exact track/lever labels.
