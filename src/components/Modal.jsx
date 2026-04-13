// src/components/Modal.jsx
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={styles.overlay} className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.sheet} className="modal-sheet animate-slideUp">
        <div style={styles.handle} />
        <h2 style={styles.title}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function ModalActions({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>{children}</div>
}

export function BtnCancel({ onClick, children = 'Peruuta' }) {
  return (
    <button onClick={onClick} style={styles.btnCancel}>{children}</button>
  )
}

export function BtnConfirm({ onClick, disabled, children = 'Vahvista' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles.btnConfirm, opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center',
    animation: 'fadeIn 0.15s ease',
  },
  sheet: {
    background: 'var(--surface)',
    borderRadius: '20px 20px 0 0',
    border: '1px solid var(--border2)',
    borderBottom: 'none',
    width: '100%', maxWidth: '520px',
    margin: '0 auto',
    padding: '24px 20px 32px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  handle: {
    width: '36px', height: '4px', borderRadius: '2px',
    background: 'var(--border2)', margin: '0 auto 20px',
  },
  title: { fontSize: '17px', fontWeight: '600', marginBottom: '18px', color: 'var(--text)' },
  btnCancel: {
    padding: '12px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text2)', fontSize: '14px',
  },
  btnConfirm: {
    padding: '12px', borderRadius: 'var(--radius)',
    border: 'none', background: 'var(--accent)',
    color: '#0d0d0d', fontSize: '14px', fontWeight: '700',
  },
}
