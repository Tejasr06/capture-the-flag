# QuizArena

QuizArena is a React, TypeScript, and Vite live quiz application using Firebase Authentication, Cloud Firestore, and Realtime Database.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and add the Firebase web app settings. Do not commit `.env.local`.
3. In Firebase Console, enable Email/Password and Anonymous sign-in, create Firestore and Realtime Database, and publish `firestore.rules` and `database.rules.json`.
4. In a terminal at the project folder, run:

   ```powershell
   npm install
   npm run dev
   ```

## Spark plan and scoring model

The app's live quiz flow does not call or deploy Cloud Functions. Live game control and score publication use the authenticated host's browser with Realtime Database rules that deny participants score writes and keep the answer key out of participant-readable game data.

The host browser calculates speed-based points after closing a question. This is a **host-referee model**, not tamper-proof server scoring: a malicious host or modified host browser could change the scores. Participants cannot directly modify official scores. Firebase Spark quotas apply; review Firebase's current limits for your project before hosting large events.

The `functions` folder contains earlier Cloud Functions code and is not included in the Firebase deployment configuration.
