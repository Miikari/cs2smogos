// src/App.jsx
import { useState } from 'react'
import { isAuthenticated, clearStoredPassword } from './lib/auth.js'
import LoginScreen from './components/LoginScreen.jsx'
import TacticsList from './components/TacticsList.jsx'
import GrenadeView from './components/GrenadeView.jsx'

const MAPS = ['Ancient', 'Anubis', 'Dust 2', 'Inferno', 'Mirage', 'Nuke', 'Overpass']
const SIDES = [
  { key: 'T', label: 'T-puoli' },
  { key: 'CT', label: 'CT-puoli' },
]

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [map, setMap] = useState('Mirage')
  const [side, setSide] = useState(null)
  const [view, setView] = useState('main') // 'main' | 'grenades'
  const [currentTactic, setCurrentTactic] = useState(null)
  const [currentZone, setCurrentZone] = useState(null)

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

  const sideColor = side === 'T' ? 'var(--t-color)' : side === 'CT' ? 'var(--ct-color)' : 'var(--text2)'

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>CS2 <span style={styles.logoSub}>Taktiikat</span></div>
        <button style={styles.logoutBtn} onClick={() => { clearStoredPassword(); setAuthed(false) }} title="Kirjaudu ulos">
          ⏻
        </button>
      </header>

      {/* Map tabs */}
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

      {/* Main content */}
      <main style={styles.main}>
        {/* Side selector */}
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
                </button>
              ))}
            </div>

            {side && (
              <div className="animate-fadeIn">
                <TacticsList
                  map={map}
                  side={side}
                  onOpenTactic={(tactic, zone) => handleOpenTactic(tactic, zone)}
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
    padding: '14px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text2)', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'all 0.15s', letterSpacing: '0.03em',
  },
  sideBtnActiveT: { background: 'rgba(224,85,85,0.12)', borderColor: 'var(--t-color)', color: 'var(--t-color)' },
  sideBtnActiveCT: { background: 'rgba(74,157,232,0.12)', borderColor: 'var(--ct-color)', color: 'var(--ct-color)' },
}
