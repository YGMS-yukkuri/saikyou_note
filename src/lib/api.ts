import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, increment } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Note } from '../types/note'

const COL = 'notes'
const TIMEOUT_MS = 10000
const MAX_ATTEMPTS = 3

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}

async function performWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  // 再試行抑止フラグ（仕様: 3回失敗したらページリロードまで抑止）
  if ((window as any).__apiRetryDisabled) throw new Error('retry_disabled')

  let attempts = 0
  // notify start
  window.dispatchEvent(new CustomEvent('api:retry-status', { detail: { state: 'start' } }))
  while (attempts < MAX_ATTEMPTS) {
    try {
      window.dispatchEvent(new CustomEvent('api:retry-attempt', { detail: { attempt: attempts + 1 } }))
      const res = await withTimeout(fn())
      window.dispatchEvent(new CustomEvent('api:retry-status', { detail: { state: 'ok' } }))
      return res
    } catch (e) {
      attempts++
      window.dispatchEvent(new CustomEvent('api:retry-attempt', { detail: { attempt: attempts } }))
      if (attempts >= MAX_ATTEMPTS) {
        (window as any).__apiRetryDisabled = true
        window.dispatchEvent(new CustomEvent('api:retry-status', { detail: { state: 'failed' } }))
        throw e
      }
      // 少し待って再試行（短いバックオフ）
      await new Promise((r) => setTimeout(r, 500 * attempts))
    }
  }
  // 実際にはここには到達しない
  throw new Error('unreachable')
}

export async function fetchAllNotes(uid: string): Promise<Note[]> {
  return await performWithRetry(async () => {
    const q = query(collection(db, COL), where('uid', '==', uid))
    const snap = await getDocs(q)
    const res: Note[] = []
    snap.forEach((d: any) => {
      res.push({ ...(d.data() as Note), id: d.id })
    })
    // cache
    localStorage.setItem('notes', JSON.stringify(res))
    return res
  })
}

export async function createNote(note: Note) {
  return await performWithRetry(async () => {
    // タイトル重複チェック
    const q = query(collection(db, COL), where('uid', '==', note.uid), where('Title', '==', note.Title))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const err: any = new Error('タイトル重複')
      err.code = 409
      throw err
    }
    const ref = await addDoc(collection(db, COL), note)
    return ref.id
  })
}

export async function updateNote(id: string, fields: Partial<Note>) {
  return await performWithRetry(async () => {
    const ref = doc(db, COL, id)
    await updateDoc(ref, fields)
  })
}

export async function deleteNote(id: string) {
  return await performWithRetry(async () => {
    const ref = doc(db, COL, id)
    await deleteDoc(ref)
  })
}

export async function incMissCount(id: string) {
  return await performWithRetry(async () => {
    const ref = doc(db, COL, id)
    await updateDoc(ref, { MissCount: increment(1) })
  })
}

