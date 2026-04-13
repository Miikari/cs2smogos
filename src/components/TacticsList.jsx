// src/components/TacticsList.jsx
import { useState, useEffect } from 'react'
import { subscribeTactics, addTactic, deleteTactic } from '../lib/firebase.js'
import Modal, { ModalActions, BtnCancel, BtnConfirm } from './Modal.jsx'

const ZONES = ['B', 'A', 'Muut']

export default function TacticsList({ map, side, onOpenTactic }) {
  const [zone, setZone] = useState(null)
  const [tactics, setTactics] = useState([])
  const [zoneCounts, setZoneCounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [tacticName, setTacticName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!zone) return
    setLoading(true)
    const unsub = subscribeTactics(map, side, zone, data => {
      setTactics(data)
      setLoading(false)
    })
    return unsub
  }, [map, side, zone])

  // Subscribe to counts for all zones
  useEffect(() => {
    const unsubs = ZONES.map(z =>
      subscribeTactics(map, side, z, data => {
        setZoneCounts(prev => ({ ...prev, [z]: data.length }))
      })
    )
    return () => unsubs.forEach(u => u())
  }, [map, side])

  async function handleAdd() {
    const name = tacticName.trim()
    if (!name) return
    setSaving(true)
    await addTactic(map, side, zone, name)
    setSaving(false)
    setTacticName('')
    setModalOpen(false)
  }

  async function handleDelete(tacticId, tacticName) {
    if (!confirm(`Poistetaanko "${tacticName}" ja kaikki sen kranaatit?`)) return
    await deleteTactic(map, side, zone, tacticId)
  }

  const sideColor = side === 'T' ? 'var(--t-color)' : 'var(--ct-color)'

  return (
    <div style={styles.wrap}>
      {/* Zone selector */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Alue</div>
        <div style={styles.zoneBtns}>
          {ZONES.map(z => (
            <button
              key={z}
              style={{ ...styles.zoneBtn, ...(zone === z ? { ...styles.zoneBtnActive, borderColor: sideColor, color: sideColor } : {}) }}
              onClick={() => setZone(z)}
            >
              {z}
              {zoneCounts[z] > 0 && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '11px',
                  background: zone === z ? sideColor : 'var(--surface3)',
                  color: zone === z ? '#0d0d0d' : 'var(--text3)',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontWeight: '600',
                }}>
                  {zoneCounts[z]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tactics */}
      {zone && (
        <div style={styles.section} className="animate-fadeIn">
          <div style={styles.tacticsHeader}>
            <span style={styles.sectionLabel}>Taktiikat</span>
            <span style={styles.count}>{tactics.length}</span>
          </div>

          {loading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : tactics.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>💨</div>
              <div>Ei vielä taktiikoita</div>
            </div>
          ) : (
            tactics.map(t => (
              <div key={t.id} style={styles.card} onClick={() => onOpenTactic(t, zone)}>
                <div style={styles.cardIcon}>🎯</div>
                <div style={styles.cardInfo}>
                  <div style={styles.cardName}>{t.name}</div>
                </div>
                <div style={styles.cardArrow}>›</div>
                <button
                  style={styles.delBtn}
                  onClick={e => { e.stopPropagation(); handleDelete(t.id, t.name) }}
                >
                  Poista
                </button>
              </div>
            ))
          )}

          <button style={styles.addBtn} onClick={() => setModalOpen(true)}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
            Lisää taktiikka
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Lisää taktiikka">
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Taktiikan nimi</label>
          <input
            style={styles.input}
            value={tacticName}
            onChange={e => setTacticName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="esim. B-default smoke"
            maxLength={60}
            autoFocus
          />
        </div>
        <ModalActions>
          <BtnCancel onClick={() => setModalOpen(false)} />
          <BtnConfirm onClick={handleAdd} disabled={!tacticName.trim() || saving}>
            {saving ? 'Lisätään...' : 'Lisää'}
          </BtnConfirm>
        </ModalActions>
      </Modal>
    </div>
  )
}

const styles = {
  wrap: { paddingTop: '4px' },
  section: { marginBottom: '20px' },
  sectionLabel: { fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' },
  zoneBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  zoneBtn: {
    padding: '9px 18px', borderRadius: '20px',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text2)', fontSize: '13px', fontWeight: '500',
    transition: 'all 0.15s',
  },
  zoneBtnActive: { background: 'var(--surface3)' },
  tacticsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  count: { fontSize: '12px', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: '10px' },
  loader: { textAlign: 'center', padding: '32px' },
  spinner: { width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' },
  emptyIcon: { fontSize: '32px', marginBottom: '10px' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
    transition: 'all 0.15s',
  },
  cardIcon: { width: '36px', height: '36px', borderRadius: 'var(--radius)', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: '14px', fontWeight: '500', color: 'var(--text)' },
  cardArrow: { color: 'var(--text3)', fontSize: '18px' },
  delBtn: {
    padding: '6px 10px', borderRadius: 'var(--radius)',
    border: '1px solid rgba(224,85,85,0.3)', background: 'transparent',
    color: 'var(--t-color)', fontSize: '12px', flexShrink: 0,
    transition: 'all 0.15s',
  },
  addBtn: {
    width: '100%', padding: '14px',
    borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border2)',
    background: 'transparent', color: 'var(--text2)', fontSize: '14px', fontWeight: '500',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'all 0.15s',
  },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' },
  input: {
    width: '100%', padding: '11px 14px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px',
    outline: 'none',
  },
}
