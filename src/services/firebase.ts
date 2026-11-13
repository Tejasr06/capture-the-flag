import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth = app ? getAuth(app) : null

export async function getDatabase(): Promise<Firestore> {
  if (!app) {
    throw new Error(
      'Firebase is not configured. Add your Firebase web app settings to .env.local and restart the dev server.',
    )
  }

  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(app)
}

export async function getRealtimeDatabase() {
  if (!app) {
    throw new Error(
      'Firebase is not configured. Add your Firebase web app settings to .env.local and restart the dev server.',
    )
  }
  if (!firebaseConfig.databaseURL) {
    throw new Error(
      'Realtime Database URL is missing. Add VITE_FIREBASE_DATABASE_URL to .env.local and restart the dev server.',
    )
  }

  const { getDatabase: initializeRealtimeDatabase } = await import('firebase/database')
  return initializeRealtimeDatabase(app, firebaseConfig.databaseURL)
}
