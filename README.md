# CS2 Taktiikat 💣

PWA-sovellus CS2:n savuille, kranaateille ja taktiikoille. Toimii kaikilla laitteilla, kaikki data synkronoituu reaaliajassa Firebaseen.

## Ominaisuudet

- 7 karttaa: Ancient, Anubis, Dust 2, Inferno, Mirage, Nuke, Overpass
- T- ja CT-puolen taktiikat erikseen
- Alueet: B-savut, Midisavut, A-savut
- Kranaattityypit: Savu, Sokaiseva, HE, Molotov
- Jopa 3 kuvaa per kranaatti + 60 merkin ohjeet
- Salasanasuojaus (ei käyttäjätilejä)
- Reaaliaikainen synkronointi kaikille käyttäjille
- PWA — asennettavissa puhelimeen

---

## Asennus

### 1. Kloonaa repo

```bash
git clone https://github.com/SINUN-KÄYTTÄJÄNIMI/cs2-taktiikat.git
cd cs2-taktiikat
npm install
```

### 2. Luo Firebase-projekti

1. Mene osoitteeseen [console.firebase.google.com](https://console.firebase.google.com)
2. Klikkaa **Add project** → anna nimi (esim. `cs2-taktiikat`) → Continue
3. Poista Google Analytics käytöstä (ei tarvita) → Create project
4. Projektin etusivulla klikkaa **</>** (Web app) → anna nimi → **Register app**
5. Kopioi `firebaseConfig`-objektin arvot — tarvitset ne `.env.local`-tiedostoon

### 3. Ota Firestore käyttöön

1. Firebase-konsolissa: **Build → Firestore Database**
2. Klikkaa **Create database**
3. Valitse **Start in production mode** → valitse sijainti (esim. `eur3`) → Enable
4. Mene **Rules**-välilehdelle ja korvaa säännöt tiedoston `firestore.rules` sisällöllä
5. Klikkaa **Publish**

### 4. Luo .env.local

```bash
cp .env.example .env.local
```

Avaa `.env.local` ja täytä Firebase-arvot sekä oma salasana:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cs2-taktiikat.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cs2-taktiikat
VITE_FIREBASE_STORAGE_BUCKET=cs2-taktiikat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_APP_PASSWORD=salasanasi-tähän
```

### 5. Testaa lokaalisti

```bash
npm run dev
```

Avaa selaimessa `http://localhost:5173/cs2-taktiikat/`

---

## Deploy GitHub Pagesiin

### Ensimmäinen kerta: GitHub-asetukset

1. Luo uusi repo GitHubissa nimellä `cs2-taktiikat`
2. Pushaa koodi:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/KÄYTTÄJÄNIMI/cs2-taktiikat.git
   git push -u origin main
   ```
3. Mene GitHubissa: **Settings → Pages**
4. Source: **GitHub Actions** → Save

### Lisää GitHub Secrets

Mene GitHubissa: **Settings → Secrets and variables → Actions → New repository secret**

Lisää jokainen `.env.local`-tiedoston rivi omana Secretinaan:

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_APP_PASSWORD` | Sovelluksen salasana |

### Deployaa

Kun pushat koodia `main`-branchiin, GitHub Actions buildaa ja deployaa automaattisesti!

Sovellus löytyy osoitteesta:
`https://KÄYTTÄJÄNIMI.github.io/cs2-taktiikat/`

---

## PWA-asennus puhelimeen

**Android (Chrome):**
Avaa sovellus → Klikkaa "Lisää aloitusnäytölle" -banneria tai valitse selaimen valikosta

**iOS (Safari):**
Avaa sovellus → Jaa-painike → "Lisää aloitusnäytölle"

---

## Rakenne

```
src/
  components/
    LoginScreen.jsx   # Salasanasivu
    TacticsList.jsx   # Taktiikoiden listaus ja lisäys
    GrenadeView.jsx   # Kranaattinäkymä
    Modal.jsx         # Uudelleenkäytettävä modal
  lib/
    firebase.js       # Firebase CRUD -funktiot
    auth.js           # Salasanasuojaus
  App.jsx             # Pääkomponentti, navigointi
  main.jsx
  index.css
```

## Tekniikka

- **React + Vite** — frontend
- **Firebase Firestore** — reaaliaikainen tietokanta
- **GitHub Pages** — hosting
- **GitHub Actions** — CI/CD
