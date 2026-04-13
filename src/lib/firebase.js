// src/lib/firebase.js
// TÄYTÄ NÄMÄ ARVOT Firebase-konsolista!
// Ohjeet: README.md

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ── Taktiikat ──────────────────────────────────────────────

// Polku: tactics/{map}__{side}__{zone}/{tacticId}
function tacticsCol(map, side, zone) {
  const key = `${map}__${side}__${zone}`
  return collection(db, 'tactics', key, 'items')
}

export async function fetchTactics(map, side, zone) {
  const snap = await getDocs(tacticsCol(map, side, zone))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribeTactics(map, side, zone, callback) {
  return onSnapshot(tacticsCol(map, side, zone), snap => {
    const tactics = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    tactics.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
    callback(tactics)
  })
}

export async function addTactic(map, side, zone, name) {
  const id = crypto.randomUUID()
  await setDoc(doc(tacticsCol(map, side, zone), id), {
    name,
    createdAt: serverTimestamp(),
  })
  return id
}

export async function renameTactic(map, side, zone, tacticId, name) {
  await setDoc(doc(tacticsCol(map, side, zone), tacticId), { name }, { merge: true })
}

export async function updateTacticDescription(map, side, zone, tacticId, description) {
  await setDoc(doc(tacticsCol(map, side, zone), tacticId), { description }, { merge: true })
}

export async function deleteTactic(map, side, zone, tacticId) {
  await deleteDoc(doc(tacticsCol(map, side, zone), tacticId))
  // Poistetaan myös kranaatit
  const grenadesSnap = await getDocs(grenadesCol(map, side, zone, tacticId))
  await Promise.all(grenadesSnap.docs.map(d => deleteDoc(d.ref)))
}

// ── Kranaatit ──────────────────────────────────────────────

// Polku: grenades/{map}__{side}__{zone}__{tacticId}/{grenadeId}
function grenadesCol(map, side, zone, tacticId) {
  const key = `${map}__${side}__${zone}__${tacticId}`
  return collection(db, 'grenades', key, 'items')
}

export function subscribeGrenades(map, side, zone, tacticId, callback) {
  return onSnapshot(grenadesCol(map, side, zone, tacticId), snap => {
    const grenades = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    grenades.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
    callback(grenades)
  })
}

export async function addGrenade(map, side, zone, tacticId, { type, note, images }) {
  const id = crypto.randomUUID()
  await setDoc(doc(grenadesCol(map, side, zone, tacticId), id), {
    type,
    note: note || '',
    images: images || [],
    createdAt: serverTimestamp(),
  })
}

export async function deleteGrenade(map, side, zone, tacticId, grenadeId) {
  await deleteDoc(doc(grenadesCol(map, side, zone, tacticId), grenadeId))
}

export async function updateGrenade(map, side, zone, tacticId, grenadeId, { type, note, images }) {
  await setDoc(doc(grenadesCol(map, side, zone, tacticId), grenadeId), {
    type,
    note: note || '',
    images: images || [],
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
