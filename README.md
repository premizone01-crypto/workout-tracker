# Workout Tracker PWA

This is a progressive web application (PWA) for tracking workouts. It is designed to run on both mobile and desktop browsers, with offline support and optional cloud synchronization.

## Features

- **Live session tracking**: Start and stop workout sessions; add exercises and sets with planned/actual reps, load, and RPE; manage circuits; and use a built‑in rest timer.
- **History and progression**: View past workouts, with charts showing estimated 1RM, volume, and other metrics. Filter history by date or exercise.
- **Templates**: Create reusable workout templates with progression rules. Start new sessions from a template to pre‑fill exercises and sets.
- **Offline storage**: All data is stored locally in `localStorage`. A service worker caches assets so the app continues to work without an internet connection.
- **Optional Firebase sync**: If you configure Firebase credentials in `config.js` and set `USE_FIREBASE = true`, data will be synchronized to Firestore using anonymous authentication.

## Getting Started

1. Serve the project using any static file server. For example, in this folder run:

```bash
npx http-server -p 8080
```

2. Open `http://localhost:8080` in your browser. You can install the app to your home screen on mobile by using the install prompt.

3. To enable Firebase sync, edit `config.js` (or create it if it doesn't exist) and add your Firebase project credentials. Set `USE_FIREBASE = true`.

## Files

- `index.html` – The main HTML page containing markup for the app.
- `app.js` – The main application logic. Handles sessions, storage, UI interactions, and charts.
- `styles.css` – The CSS stylesheet for styling the app.
- `manifest.json` – PWA manifest describing the app (icons, name, colors).
- `service-worker.js` – Service worker for caching assets and enabling offline support.

## Customization

You can modify `app.js` to pre‑seed templates, exercises, or add additional features. The data model is stored in `localStorage` under the key `workoutData`. See `app.js` for the schema.
