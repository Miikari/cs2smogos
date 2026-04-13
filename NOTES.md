# CS2 Smogos - Projektin muistiinpanot

Liitä tämä tiedosto Claude-keskusteluun kun jatkat kehitystä.

## Stack
- React + Vite
- Firebase Firestore (jaettu data kaikille käyttäjille)
- GitHub Pages deploy (GitHub Actions)
- Repo: https://github.com/miikari/cs2smogos

## Kartat
Ancient, Anubis, Dust 2, Inferno, Mirage, Nuke, Overpass

## Puolet
- T-puoli
- CT-puoli

## Alueet (ZONES) — TacticsList.jsx
- A-Site (aiemmin "B")
- B-Site (aiemmin "A")
- Muut (aiemmin "Midisavut")

## Kranaattityypit — GrenadeView.jsx
- Savu
- Valo (flash)
- HE
- Molotov

## Tiedostorakenne
```
src/
  App.jsx
  main.jsx
  index.css
  components/
    LoginScreen.jsx   — salasanasivu
    TacticsList.jsx   — taktiikat per kartta/puoli/alue
    GrenadeView.jsx   — kranaatit per taktiikka (paste, crop, drag-reorder)
    Modal.jsx         — uudelleenkäytettävä modal (keskellä desktop, alhaalla mobiili)
  lib/
    firebase.js       — Firestore CRUD
    auth.js           — salasanasuojaus (sessionStorage)
```

## Ominaisuudet
- Taktiikoiden lisäys, muokkaus (nimi), poisto
- Kranaattien lisäys, muokkaus, poisto
- Kuvat: tiedostosta, Ctrl+V leikepöydältä, rajaustyökalu, drag-to-reorder
- Zone-napeissa näkyy taktiikoiden lukumäärä
- Kirjautuminen yhteisellä salasanalla (ei käyttäjätilejä)
- PWA — asennettavissa puhelimeen

## Muuta
- .env.local ei ole gitissä (gitignore)
- GitHub Secrets sisältää Firebase-avaimet ja salasanan