// src/lib/auth.js
// Yksinkertainen salasanasuojaus - ei käyttäjätilejä
// Salasana tallennetaan sessionStorage:iin (häviää kun selain suljetaan)

const SESSION_KEY = 'cs2_auth'

export function getStoredPassword() {
  return sessionStorage.getItem(SESSION_KEY)
}

export function setStoredPassword(pw) {
  sessionStorage.setItem(SESSION_KEY, pw)
}

export function clearStoredPassword() {
  sessionStorage.removeItem(SESSION_KEY)
}

// Salasana on määritelty .env tiedostossa
export function checkPassword(input) {
  const correct = import.meta.env.VITE_APP_PASSWORD
  if (!correct) {
    console.warn('VITE_APP_PASSWORD ei ole määritelty .env tiedostossa!')
    return false
  }
  return input === correct
}

export function isAuthenticated() {
  const stored = getStoredPassword()
  if (!stored) return false
  return checkPassword(stored)
}
