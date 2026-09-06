# Honey

Honey is a local-first meal check-in app for users and care companions. It tracks daily meal updates, reminder timing, alert history, and per-user privacy settings in a small React + Vite TypeScript app.

## Features

- Daily meal check-ins for breakfast, lunch, dinner, and snack
- Reminder settings with quiet hours and escalation alerts
- Care companion dashboard for shared meal visibility
- Local backup import/export and browser storage persistence
- Theme support for light, dark, and system modes

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase tooling for local emulators and optional backend support

## Getting Started

1. Install dependencies.

```bash
npm install
```

2. Start the development server.

```bash
npm run dev
```

3. Build for production.

```bash
npm run build
```

4. Type-check the project.

```bash
npm run lint
```

## Optional Firebase Emulators

If you want to run the Firebase emulator suite locally, use:

```bash
npm run emulators
```

## Project Notes

- The app is designed to work locally without a remote server.
- Data is stored in browser storage and can be exported/imported from the Settings screen.
- The codebase lives under `src/` and is organized by components, contexts, pages, and shared utilities.
