

# <img src="./public/favicon.svg" alt="7 and 2 poker icon" width="30" height="30" /> Home Game

[![Live Demo](https://img.shields.io/badge/demo-github_pages-2ea44f?logo=github)](https://mattaschmann.github.io/home-game/)
![React](https://img.shields.io/badge/react-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/vite-latest-646cff?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)

![App screenshot](./assets/screenshot.png)


 `home-game` is a small React + Vite app for tracking a home poker game.

It helps you:

- add players at the table
- log buy-ins for each player
- record final stacks at the end of the game
- see who is up or down in the settlement view
- store optional Venmo handles per player for one-tap settlement links
- share the current session link (with optional Bitly shortening) when people join remotely
- reset values or remove players when the table changes

## Live Demo

- [Open the app on GitHub Pages](https://mattaschmann.github.io/home-game/)

## How it works

- Player data is saved in the browser so your table state persists between refreshes.
- Local storage is the default state mode.
- You can add a player from scratch or reuse names from past games.
- Buy-ins and final stacks use dollar amounts and the app calculates totals automatically.
- The settlement section compares total buy-ins against total stacks to show whether the game is balanced.
- Tap the session name in the header to rename it; the name persists locally, syncs via Firebase collaboration, and is used in share dialogs/browser titles.
- Click a player's name to open Player Settings where you can rename them or add a Venmo handle that syncs and powers settlement links.
- Optional Firebase collaboration mode can sync a shared session through a URL that contains base64-url encoded Firebase config + session id metadata.

## Firebase collaboration (optional)

This app supports a bring-your-own Firebase setup. No Firebase credentials are hardcoded in this repo.

1. Create a Firebase project
   - Open [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use an existing one)

2. Add a Web app and copy config
   - In Project Settings > General, add a Web app
   - Copy the config object values (`apiKey`, `authDomain`, `projectId`, `appId`, etc.)
   - Paste this JSON into **Game Settings > Firebase config** in the app

3. Enable Anonymous Authentication (works on Spark/free tier)
   - Go to Authentication > Sign-in method
   - Enable **Anonymous** provider

4. Add your app domain to Firebase Auth authorized domains
   - Go to Authentication > Settings > Authorized domains
   - Add your deployed app host (for GitHub Pages, this is usually `username.github.io`)
   - Keep `authDomain` from Firebase config as-is (typically `your-project.firebaseapp.com`)

5. Create Firestore database
   - Go to Firestore Database and create a database
   - Start in production or test mode (production recommended)

6. Set Firestore security rules baseline

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /homeGameSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

7. Start collaboration in the app
   - Open **Game Settings**
   - Paste Firebase config JSON
   - Enter a session id (for example: `friday-night-game`)
   - Click **Start / Update Link**
   - Share the URL with collaborators to join the same session

Notes:
- Without Firebase URL metadata, the app stays in local-only mode.
- Collaboration metadata in the URL includes Firebase config + session id (base64-url encoded).

## Share links & Bitly (optional)

- The Share Link button uses the Web Share API whenever available and falls back to copying the link to the clipboard.
- Sharing works even without Bitly; you'll share the canonical URL for the current session (including Firebase metadata if enabled).
- In Firebase collaboration mode, the first short link that gets created for a session is stored in Firestore so other collaborators can reuse it automatically.

You can optionally connect Bitly so shared URLs are shorter.

- Bitly connection is configured in **Game Settings**.
- Bitly auth/config is stored locally in the current browser/device.
- If Bitly is not connected, sharing still works and uses the full URL.

Bitly BYO token setup:

1. Generate an access token from your Bitly account settings.
2. In the app, open **Game Settings > Bitly Sharing**.
3. Paste the access token and click **Save Bitly Settings**.
4. If needed, click **Clear Bitly Settings** to remove local Bitly config from this browser.

## Player Venmo links (optional)

- Open Player Settings by clicking a player's name to add their Venmo handle (you can include or omit the `@`).
- Handles sync just like other player data, so collaborators in Firebase sessions see the same info.
- The Settlement view shows a Venmo icon next to each player with a handle; tapping it opens the correct pay/request flow with the owed amount pre-filled (deep link on mobile with a venmo.com fallback on desktop).
- Leave the handle blank if the player doesn't use Venmo; no links are shown for them.

## Tech stack

- React 19
- Vite
- TypeScript tooling (tsconfig + editor type checking for the JSX files)
- `gh-pages` for deployment

## Scripts

- `npm run dev` - start the local dev server
- `npm run dev-lan` - start the dev server on your local network
- `npm run build` - create a production build
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build locally
- `npm run deploy` - build and publish to GitHub Pages

## License

MIT
