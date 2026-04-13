// src/components/LoginScreen.jsx
import { useState } from 'react'
import { checkPassword, setStoredPassword } from '../lib/auth.js'

export default function LoginScreen({ onSuccess }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (checkPassword(pw)) {
      setStoredPassword(pw)
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card} className={shake ? 'shake' : ''}>
        <div style={styles.logo}>CS2</div>
        <div style={styles.subtitle}>Taktiikat</div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Salasana</label>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="Syötä salasana..."
            style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
            autoFocus
          />
          {error && <div style={styles.errorMsg}>Väärä salasana</div>}
          <button type="submit" style={styles.btn} disabled={!pw}>
            Kirjaudu sisään
          </button>
        </form>
      </div>
      <style>{`
        .shake { animation: shakeAnim 0.4s ease; }
        @keyframes shakeAnim {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '20px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease',
  },
  logo: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--accent)',
    letterSpacing: '0.08em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text2)',
    marginBottom: '32px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: {
    fontSize: '11px',
    color: 'var(--text3)',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  input: {
    padding: '12px 14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputError: { borderColor: 'var(--t-color)' },
  errorMsg: {
    fontSize: '12px',
    color: 'var(--t-color)',
    textAlign: 'left',
  },
  btn: {
    marginTop: '8px',
    padding: '13px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#0d0d0d',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'opacity 0.15s',
    cursor: 'pointer',
  },
}
