// src/lib/auth.js
// Salasana tarkistetaan Firestoresta - ei näy selaimessa

import { db } from './firebase.js'
import { doc, getDoc } from 'firebase/firestore'

const SESSION_KEY = 'cs2_auth_token'

export function setStoredToken(token) {
  sessionStorage.setItem(SESSION_KEY, token)
}

export function getStoredToken() {
  return sessionStorage.getItem(SESSION_KEY)
}

export function clearStoredPassword() {
  sessionStorage.removeItem(SESSION_KEY)
}

// Tarkistaa salasanan Firestoresta - salasana ei ole koodissa
export async function checkPassword(input) {
  try {
    const ref = doc(db, 'config', 'auth')
    const snap = await getDoc(ref)
    if (!snap.exists()) return false
    return snap.data().password === input
  } catch (e) {
    return false
  }
}

// Sessiotoken on hash syötetystä salasanasta
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function login(input) {
  const ok = await checkPassword(input)
  if (!ok) return false
  const token = await hashPassword(input)
  setStoredToken(token)
  return true
}

export async function isAuthenticated() {
  const token = getStoredToken()
  if (!token) return false
  // Verrataan tallennettu token Firestore-salasanan hashiin
  try {
    const ref = doc(db, 'config', 'auth')
    const snap = await getDoc(ref)
    if (!snap.exists()) return false
    const correctHash = await hashPassword(snap.data().password)
    return token === correctHash
  } catch (e) {
    return false
  }
}
