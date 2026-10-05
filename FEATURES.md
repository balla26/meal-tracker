# Honey — Feature Roadmap

Honey is a local-first meal check-in app: a `user` logs breakfast/lunch/dinner/snack
status, a configurable reminder engine nudges them (gentle → follow-up → escalation),
and an opted-in `engineer` (care companion) sees a dashboard, weekly stats, and alert
history. Everything currently lives in `localStorage`; Firebase exists only as unused
scaffolding. This doc catalogs gaps and feature ideas, grouped by theme, grounded in
what the codebase actually does today (file refs included so each item is actionable).

---

## 0. Foundational gaps (fix before building more on top)

These aren't "nice to have" features — they're places where the app is architecturally
pretending to do something it doesn't, which will bite the first real user.

- **Firebase is fully wired and fully unused.** `src/lib/firebase.ts` initializes Auth
  + Firestore, `firebase/firestore.rules` encodes a real consent model
  (`canSeeUser`/`shareWithEngineer`), but `DataContext.tsx` never imports `auth` or
  `db` from it — persistence is `localStorage` under two different keys
  (`honey-db-cache-v1` and `honey-db-server-v1`), and "server sync" is really just
  writing to the second key (`src/lib/db.ts:105-114`). There's no real network,
  multi-device sync, or cross-user data isolation. **This means the Care Dashboard
  only ever shows data that's *already in the same browser* as the companion** —
  the core "remote check-in" premise of the app doesn't actually work across devices
  yet. This is the single highest-leverage item on this list.
- **Settings claims a file-backed save that doesn't exist.** The UI says data is
  "saved automatically to a real file inside the project: `data/honey-data.json`"
  (`src/pages/Settings.tsx:238`), but `vite.config.ts` has no middleware and no such
  file is ever written — it's another `localStorage` key. Either build the dev-server
  middleware this implies, or fix the copy so it doesn't overpromise.
- **No real push notifications.** `src/lib/notifications.ts` uses the plain
  `Notification` API, which only fires while the tab is open. A reminder app whose
  reminders stop working the moment you close the browser tab defeats its own
  purpose. Needs a service worker + Web Push (or a native wrapper) to notify when
  the app isn't foregrounded.
- **Not an installable PWA.** No `manifest.json`, no service worker, no offline
  shell — despite `index.html` already carrying PWA-flavored meta tags
  (`theme-color`, `viewport-fit=cover`). Cheap to add, meaningfully improves the
  "install once, forget it's a browser tab" experience this app needs.
- **Reminder tone is global, not per relationship.** `ReminderSettings.tone` lives
  once on the user's profile; every companion who has access gets the same tone
  (`CareDashboard.tsx` even lets an engineer locally override it in component state
  only — never persisted). If Honey ever supports multiple companions per user (see
  below), tone needs to be per user↔companion pair, not global.

---

## 1. Safety & escalation (the actual point of a "care" app)

The current escalation ceiling is: mark the meal `missed` and drop an alert in the
companion's dashboard, which they have to be looking at. For the elder-care /
solo-living / recovery-support use cases this app is clearly aimed at, silence is the
dangerous case, and dashboards don't wake anyone up.

- **Emergency/next-of-kin escalation tier.** If a user misses *all* meals for a full
  day (or N consecutive days), escalate beyond the normal companion alert to a
  designated emergency contact — a tier above `escalateDelayMinutes`, extending
  `evaluateReminders()` in `src/lib/reminders.ts`.
- **"I'm okay" wellness check, independent of meals.** A single daily button
  (separate from meal status) a user can tap so a companion sees *some* signal even
  on a day they genuinely skip a meal on purpose.
- **SMS/phone fallback for alerts.** Companions shouldn't need the app open to find
  out their parent/friend has gone 36 hours silent. Twilio (or similar) SMS for
  escalation-tier alerts only, opt-in, so this stays cheap and non-spammy.
- **Proxy check-in.** Let a companion log a meal status *for* the user ("I called,
  they said they ate") — useful when the user isn't tech-capable, and currently
  impossible since `updateMealStatus` is only exposed on the Home screen the user
  themselves sees.

## 2. Care network depth

Right now "sharing" is a single boolean (`Profile.shareWithEngineer`) and the data
model implies one user ↔ one engineer in practice, even though `users`/`engineers`
are separate arrays.

- **Multiple companions per user**, each with their own relationship: tone, which
  meals they're alerted on, whether they see notes or just status. Natural extension
  of the existing `shareWithEngineer` boolean into a `CareLink` join record.
- **Two-way notes.** Today alerts and reminders are one-directional
  (companion → user via reminder text, user → companion via the meal `note` field
  only). Let a companion leave a short encouragement note back
  ("saw you ate dinner, proud of you 💛") surfaced as a toast/notification to the
  user — this is the part of the product that makes it feel caring rather than
  surveillance.
- **Granular, per-field sharing**, not all-or-nothing: e.g. share meal *status* but
  not free-text `note` content (notes can contain things like "ate at the hospital
  cafeteria" that are more sensitive than a yes/no).
- **Time-boxed sharing.** "Share with my companion for the next 2 weeks while I'm
  recovering from surgery" — auto-revokes `shareWithEngineer`, rather than requiring
  the user to remember to turn it off.
- **Audit trail for the user**: "Jordan viewed your meal history on Tuesday" — keeps
  the consent model (already strong in `firestore.rules`) visible, not just enforced
  server-side.

## 3. Smarter reminders

`evaluateReminders()` is currently a fixed, per-meal-type clock — same time every
day, same escalation delays, regardless of the user's actual rhythm.

- **Adaptive timing.** Learn from `MealEntry.updatedAt` history and quietly nudge
  the default reminder time toward when the user *actually* tends to eat, instead of
  a static 08:30/13:00/19:30.
- **Calendar-aware suppression.** Skip or delay a reminder if it lands during a
  known busy block (would need a calendar integration, but even a manual "I'm busy
  until 3pm" snooze-all would cover most of the value cheaply).
- **Smarter snooze.** The current snooze is a flat +15/30/60 min
  (`src/components/UpdateMealSheet.tsx:75-87`). "Remind me at my next meal window
  instead" or "skip today, don't ask again" are both real user intents the current
  3 buttons don't cover.
- **Notification quick actions.** Reply "Ate 😌" directly from the OS notification
  (needs the service worker/push work in §0) instead of having to open the app.

## 4. Insight & reporting

The Care Dashboard already computes weekly completed/missed counts and
"most delayed meal" (`CareDashboard.tsx:35-54`) — there's an appetite for pattern
surfacing, just not much built yet.

- **Trend charts** (weekly/monthly completion rate, per-meal-type reliability) —
  the underlying data (`MealEntry[]` with `date`, `status`, `updatedAt`) already
  supports this with no schema change.
- **Exportable report for a doctor/care team** — PDF or CSV summary over a date
  range, since `exportBackup()` already exists for raw JSON but nothing produces a
  human-readable summary.
- **Positive streaks**, framed as encouragement, not a scoreboard — "7-day check-in
  streak" shown to the *user*, not just missed-meal stats shown to the companion.
  The existing `celebrationText()` single string (`src/lib/reminders.ts:55-57`) is a
  natural place to grow this.
- **Weekly recap notification** to both user and companion summarizing the week —
  gives the companion a reason to feel reassured even on weeks with no alerts at all.

## 5. Accessibility & reach

The target users for a "did you eat" check-in (elderly, chronically ill, recovering,
neurodivergent) skew toward needing more than a phone-literate 20-something does.

- **Large-text / high-contrast mode**, beyond the existing light/dark/system theme
  toggle in Settings.
- **Voice check-in** ("Hey, I ate lunch") for users who struggle with small tap
  targets.
- **No-smartphone fallback**: a companion-initiated phone call/SMS check-in flow for
  users who don't use the app at all — makes Honey usable *by proxy*, widening who
  it can actually help.
- **i18n/localization** — all strings are currently hardcoded English JSX.
- **Home-screen widget / Apple Watch complication** for one-tap status update
  without opening the app at all.

## 6. Data model rough edges worth closing

- `AlertEntry.mealId` can be `''` when `sendEngineerReminder` fires for a meal that
  doesn't exist yet for today (`DataContext.tsx:156-157`) — a defensive gap rather
  than a feature, but worth a `missingTodayEntries`-style guard.
- No way to **edit/delete a past meal entry** once logged — history is append-only
  display (`History.tsx`), no correction flow for a mis-tap.
- No **account deletion / data export compliance flow** beyond the local "erase
  meal history & alerts" button (`Settings.tsx:270-303`), which doesn't touch
  `profiles` — relevant if this ever stores real people's health-adjacent data under
  GDPR/CCPA-style obligations.

---

## Suggested next 3

1. **Wire up the real Firebase backend** (§0) — nothing else in the "care companion"
   half of the product is real without cross-device sync; this unblocks everything
   else.
2. **Service worker + Web Push** (§0) — a reminder app that only reminds you while a
   tab happens to be open isn't yet doing its job.
3. **Emergency escalation tier + proxy check-in** (§1) — the highest-value, most
   differentiated feature for the actual target audience (someone living alone whose
   family worries about them), and it's a relatively small extension of the
   escalation logic that already exists in `evaluateReminders()`.
