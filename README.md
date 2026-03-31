

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
- reset values or remove players when the table changes

## Live Demo

- [Open the app on GitHub Pages](https://mattaschmann.github.io/home-game/)

## How it works

- Player data is saved in the browser so your table state persists between refreshes.
- Local storage is the default state mode.
- You can add a player from scratch or reuse names from past games.
- Buy-ins and final stacks use dollar amounts and the app calculates totals automatically.
- The settlement section compares total buy-ins against total stacks to show whether the game is balanced.
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

## Bitly sharing (optional)

The app can share the current session URL directly out of the box. You can optionally connect Bitly so shared URLs are shorter.

- Bitly connection is configured in **Game Settings**.
- Bitly auth/config is stored locally in the current browser/device.
- If Bitly is not connected, sharing still works and uses the full URL.
- For Firebase collaboration sessions, once a collaborator creates a Bitly short link, it is stored in Firebase and reused by other collaborators for the same long URL.

Bitly BYO token setup:

1. Generate an access token from your Bitly account settings.
2. In the app, open **Game Settings > Bitly Sharing**.
3. Paste the access token and click **Save Bitly Settings**.
4. If needed, click **Clear Bitly Settings** to remove local Bitly config from this browser.

## Tech stack

- React 19
- Vite
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
