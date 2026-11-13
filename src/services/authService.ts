import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './firebase'

function getConfiguredAuth() {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local, add your Firebase web app values, and restart the dev server.',
    )
  }

  return auth
}

export async function registerHost(
  displayName: string,
  email: string,
  password: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    getConfiguredAuth(),
    email.trim(),
    password,
  )

  await updateProfile(credential.user, { displayName: displayName.trim() })
  return credential
}

export function loginHost(email: string, password: string) {
  return signInWithEmailAndPassword(getConfiguredAuth(), email.trim(), password)
}

export function logoutHost() {
  return signOut(getConfiguredAuth())
}

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Something went wrong. Please try again.'
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already exists for this email. Try signing in.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed':
      'Email/password sign-in is disabled in Firebase Authentication settings.',
  }

  return messages[code] ?? error.message
}
