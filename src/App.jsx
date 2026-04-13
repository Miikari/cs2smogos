// src/App.jsx
import { useState, useEffect, useCallback } from 'react'
import { isAuthenticated, clearStoredPassword } from './lib/auth.js'
import LoginScreen from './components/LoginScreen.jsx'
import TacticsList from './components/TacticsList.jsx'
import GrenadeView from './components/GrenadeView.jsx'
import { fetchTactics } from './lib/firebase.js'

const MAPS = ['Ancient', 'Anubis', 'Dust 2', 'Inferno', 'Mirage', 'Nuke', 'Overpass']
const SIDES = [
  { key: 'T', label: 'T-puoli' },
  { key: 'CT', label: 'CT-puoli' },
]
const ZONES = ['A-Site', 'B-Site', 'Muut']

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [map, setMap] = useState('Mirage')
  const [side, setSide] = useState(null)
  const [view, setView] = useState('main')
  const [currentTactic, setCurrentTactic] = useState(null)
  const [currentZone, setCurrentZone] = useState(null)
  const [sideCounts, setSideCounts] = useState({})

  // Tarkista auth Firestoresta mountissa
  useEffect(() => {
    isAuthenticated().then(ok => {
      setAuthed(ok)
      setAuthChecked(true)
    })
  }, [])

  const refreshCounts = useCallback(async () => {
    const counts = {}
    await Promise.all(
      SIDES.flatMap(s =>
        ZONES.map(async z => {
          const data = await fetchTactics(map, s.key, z)
          counts[s.key] = (counts[s.key] || 0) + data.length
        })
      )
    )
    setSideCounts(counts)
  }, [map])

  useEffect(() => {
    if (authed) refreshCounts()
  }, [refreshCounts, authed])

  // Latausruutu ennen auth-tarkistusta
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid #333', borderTopColor: '#e8c44a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />
  }

  function handleSelectMap(m) {
    setMap(m)
    setSide(null)
    setView('main')
    setCurrentTactic(null)
    setCurrentZone(null)
  }

  function handleOpenTactic(tactic, zone) {
    setCurrentTactic(tactic)
    setCurrentZone(zone)
    setView('grenades')
  }

  function handleBack() {
    setView('main')
    setCurrentTactic(null)
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logo}>CS2 <span style={styles.logoSub}>Taktiikat</span></div>
        <button style={styles.logoutBtn} onClick={() => { clearStoredPassword(); setAuthed(false) }} title="Kirjaudu ulos">
          ⏻
        </button>
      </header>

      <nav style={styles.mapTabs}>
        {MAPS.map(m => (
          <button
            key={m}
            style={{ ...styles.mapTab, ...(m === map ? styles.mapTabActive : {}) }}
            onClick={() => handleSelectMap(m)}
          >
            {m}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {view === 'main' && (
          <>
            <div style={styles.sideGrid}>
              {SIDES.map(s => (
                <button
                  key={s.key}
                  style={{
                    ...styles.sideBtn,
                    ...(side === s.key
                      ? s.key === 'T'
                        ? styles.sideBtnActiveT
                        : styles.sideBtnActiveCT
                      : {}),
                  }}
                  onClick={() => setSide(s.key)}
                >
                  {s.label}
                  {sideCounts[s.key] > 0 && (
                    <span style={{
                      marginLeft: '8px', fontSize: '12px', fontWeight: '600',
                      background: side === s.key ? 'rgba(255,255,255,0.15)' : 'var(--surface3)',
                      color: side === s.key ? '#fff' : 'var(--text3)',
                      borderRadius: '10px', padding: '1px 8px',
                    }}>
                      {sideCounts[s.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {side && (
              <div className="animate-fadeIn">
                <TacticsList
                  map={map}
                  side={side}
                  onOpenTactic={(tactic, zone) => handleOpenTactic(tactic, zone)}
                  onTacticAdded={refreshCounts}
                />
              </div>
            )}
          </>
        )}

        {view === 'grenades' && currentTactic && (
          <div className="animate-fadeIn">
            <GrenadeView
              map={map}
              side={side}
              zone={currentZone}
              tactic={currentTactic}
              onBack={handleBack}
            />
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  app: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    padding: '0 16px', display: 'flex', alignItems: 'center',
    height: '52px', position: 'sticky', top: 0, zIndex: 100, gap: '12px',
  },
  logo: { fontSize: '18px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--accent)', flex: 1 },
  logoSub: { color: 'var(--text2)', fontWeight: '400', fontSize: '13px', marginLeft: '4px' },
  logoutBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    color: 'var(--text3)', fontSize: '16px', padding: '4px 10px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  mapTabs: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    display: 'flex', overflowX: 'auto', padding: '0 8px',
    scrollbarWidth: 'none',
  },
  mapTab: {
    padding: '14px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text3)',
    cursor: 'pointer', whiteSpace: 'nowrap',
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
  },
  mapTabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
  main: { flex: 1, padding: '16px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  sideGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  sideBtn: {
    padding: '14px', borderRadius: 'var(--radius-lg)',
    borderWidth: '1.5px', borderStyle: 'solid', borderColor: 'var(--border)',
    background: 'var(--surface)', color: 'var(--text2)', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'all 0.15s', letterSpacing: '0.03em',
  },
  sideBtnActiveT: { background: 'rgba(224,85,85,0.12)', borderColor: 'var(--t-color)', color: 'var(--t-color)' },
  sideBtnActiveCT: { background: 'rgba(74,157,232,0.12)', borderColor: 'var(--ct-color)', color: 'var(--ct-color)' },
}
