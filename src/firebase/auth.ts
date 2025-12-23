import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './config'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  return await signInWithPopup(auth, provider)
}

export async function signOutUser() {
  return await signOut(auth)
}

export function onAuthChanged(callback: (user: User | null) => void) {
  // 追加: window に現在のユーザーをセットしておく (簡易)
  return onAuthStateChanged(auth, (u) => {
    (window as any).firebaseCurrentUser = u || null
    callback(u)
  })
}

export function getCurrentUser() {
  return (window as any).firebaseCurrentUser || null
}
