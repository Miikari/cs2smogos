// src/components/GrenadeView.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeGrenades, addGrenade, deleteGrenade, updateGrenade, updateTacticDescription } from '../lib/firebase.js'
import Modal, { ModalActions, BtnCancel, BtnConfirm } from './Modal.jsx'

const BASE = import.meta.env.BASE_URL

const GRENADE_TYPES = [
  { key: 'smoke',   label: 'Savu',    color: '#a0a0c0', bg: 'rgba(150,150,180,0.15)', icon: `${BASE}icons/smoke.svg`   },
  { key: 'flash',   label: 'Valo',    color: '#e8c44a', bg: 'rgba(232,196,74,0.15)',  icon: `${BASE}icons/flash.svg`   },
  { key: 'he',      label: 'HE',      color: '#e05555', bg: 'rgba(224,85,85,0.15)',   icon: `${BASE}icons/he.svg`      },
  { key: 'molotov', label: 'Molotov', color: '#f0a030', bg: 'rgba(240,160,48,0.15)',  icon: `${BASE}icons/molotov.svg` },
]

// Pakkaa kuva max 800px leveäksi ja 70% JPEG-laadulla
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onerror = rej
    reader.onload = e => {
      const img = new Image()
      img.onerror = rej
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        res(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ── Crop Modal ────────────────────────────────────────────────────────────────
function CropModal({ src, onDone, onCancel }) {
  const canvasRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState(null)
  const [rect, setRect] = useState(null)
  const imgRef = useRef()
  const [imgLoaded, setImgLoaded] = useState(false)

  function getPos(e, el) {
    const b = el.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.max(0, Math.min(clientX - b.left, b.width)),
      y: Math.max(0, Math.min(clientY - b.top, b.height)),
    }
  }

  function onMouseDown(e) {
    e.preventDefault()
    const pos = getPos(e, e.currentTarget)
    setStart(pos)
    setRect(null)
    setDragging(true)
  }

  function onMouseMove(e) {
    if (!dragging || !start) return
    e.preventDefault()
    const pos = getPos(e, e.currentTarget)
    setRect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    })
  }

  function onMouseUp() {
    setDragging(false)
  }

  function applyCrop() {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !rect || rect.w < 5 || rect.h < 5) {
      // No crop, return original
      onDone(src)
      return
    }
    const b = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / b.width
    const scaleY = img.naturalHeight / b.height
    canvas.width = rect.w * scaleX
    canvas.height = rect.h * scaleY
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, rect.x * scaleX, rect.y * scaleY, rect.w * scaleX, rect.h * scaleY, 0, 0, canvas.width, canvas.height)
    onDone(canvas.toDataURL('image/jpeg', 0.7))
  }

  return (
    <div style={cs.cropOverlay}>
      <div style={cs.cropBox}>
        <div style={cs.cropHeader}>
          <span style={cs.cropTitle}>Rajaa kuva</span>
          <span style={cs.cropHint}>Vedä rajaus hiirellä</span>
        </div>
        <div
          style={cs.cropImgWrap}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            style={cs.cropImg}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
          />
          {rect && rect.w > 2 && (
            <div style={{
              position: 'absolute',
              left: rect.x, top: rect.y,
              width: rect.w, height: rect.h,
              border: '2px solid var(--accent)',
              background: 'rgba(232,196,74,0.15)',
              pointerEvents: 'none',
            }} />
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={cs.cropActions}>
          <button style={cs.cropBtnCancel} onClick={onCancel}>Peruuta</button>
          <button style={cs.cropBtnSkip} onClick={() => onDone(src)}>Käytä sellaisenaan</button>
          <button style={cs.cropBtnApply} onClick={applyCrop} disabled={!rect || rect.w < 5}>
            Rajaa
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Image slot with drag-to-reorder ──────────────────────────────────────────
function ImageSlots({ images, onChange }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const fileRefs = [useRef(), useRef(), useRef()]
  const [cropSrc, setCropSrc] = useState(null)
  const [cropTargetIdx, setCropTargetIdx] = useState(null)

  async function handleFile(idx, file) {
    if (!file) return
    const b64 = await compressImage(file)
    setCropTargetIdx(idx)
    setCropSrc(b64)
  }

  function handleCropDone(b64) {
    const next = [...images]
    next[cropTargetIdx] = b64
    onChange(next)
    setCropSrc(null)
    setCropTargetIdx(null)
    if (fileRefs[cropTargetIdx]?.current) fileRefs[cropTargetIdx].current.value = ''
  }

  function clearImage(idx) {
    const next = [...images]
    next[idx] = null
    onChange(next)
    if (fileRefs[idx]?.current) fileRefs[idx].current.value = ''
  }

  function openCropForExisting(idx) {
    setCropTargetIdx(idx)
    setCropSrc(images[idx])
  }

  // Paste from clipboard
  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          const firstEmpty = images.findIndex(i => !i)
          const targetIdx = firstEmpty >= 0 ? firstEmpty : 0
          handleFile(targetIdx, file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [images])

  function onDragStart(idx) { setDragIdx(idx) }
  function onDragOver(e, idx) { e.preventDefault(); setOverIdx(idx) }
  function onDrop(idx) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...images]
    const tmp = next[dragIdx]
    next[dragIdx] = next[idx]
    next[idx] = tmp
    onChange(next)
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={() => { setCropSrc(null); setCropTargetIdx(null) }}
        />
      )}
      <div style={styles.imgUploadGrid}>
        {[0, 1, 2].map(idx => (
          <div
            key={idx}
            style={{
              ...styles.imgSlot,
              outline: overIdx === idx && dragIdx !== idx ? '2px solid var(--accent)' : 'none',
              opacity: dragIdx === idx ? 0.5 : 1,
            }}
            draggable={!!images[idx]}
            onDragStart={() => onDragStart(idx)}
            onDragOver={e => onDragOver(e, idx)}
            onDrop={() => onDrop(idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
          >
            {images[idx] ? (
              <>
                <img src={images[idx]} alt="" style={styles.imgSlotPreview} />
                <div style={styles.imgSlotActions}>
                  <button style={styles.imgActionBtn} title="Rajaa" onClick={() => openCropForExisting(idx)}>✂</button>
                  <button style={styles.imgActionBtn} title="Poista" onClick={() => clearImage(idx)}>×</button>
                </div>
                <div style={styles.dragHandle} title="Raahaa järjestelläksesi">⠿</div>
              </>
            ) : (
              <label style={styles.imgSlotLabel}>
                <span style={{ fontSize: '22px', color: 'var(--text3)' }}>+</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Kuva {idx + 1}</span>
                <span style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>tai Ctrl+V</span>
                <input
                  ref={fileRefs[idx]}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(idx, e.target.files[0])}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Grenade Form ──────────────────────────────────────────────────────────────
function GrenadeForm({ initialType, initialNote, initialImages, onSave, onCancel, saving }) {
  const [type, setType] = useState(initialType || 'smoke')
  const [note, setNote] = useState(initialNote || '')
  const [images, setImages] = useState(
    initialImages
      ? [...initialImages, null, null, null].slice(0, 3)
      : [null, null, null]
  )

  return (
    <>
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>Tyyppi</label>
        <div style={styles.typeGrid}>
          {GRENADE_TYPES.map(t => (
            <button
              key={t.key}
              style={{ ...styles.typeBtn, ...(type === t.key ? { borderColor: t.color, color: t.color, background: t.bg } : {}) }}
              onClick={() => setType(t.key)}
            >
              <img src={t.icon} alt="" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '5px' }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.formLabel}>Kuvat (max 3) — raahaa järjestelläksesi</label>
        <ImageSlots images={images} onChange={setImages} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.formLabel}>Ohjeet</label>
        <textarea
          style={styles.textarea}
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 60))}
          rows={3}
          placeholder="Lyhyt kuvaus heittopaikasta..."
          maxLength={60}
        />
        <div style={styles.charCount}>{note.length}/60</div>
      </div>

      <ModalActions>
        <BtnCancel onClick={onCancel} />
        <BtnConfirm
          onClick={() => onSave({ type, note: note.trim(), images: images.filter(Boolean) })}
          disabled={saving}
        >
          {saving ? 'Tallennetaan...' : 'Tallenna'}
        </BtnConfirm>
      </ModalActions>
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function GrenadeView({ map, side, zone, tactic, onBack }) {
  const [grenades, setGrenades] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { src, srcs, idx }

  function openLightbox(srcs, idx) {
    setLightbox({ srcs, idx })
  }
  const [desc, setDesc] = useState(tactic.description || '')
  const [descSaving, setDescSaving] = useState(false)
  const descRef = useRef()

  async function handleSaveDesc() {
    setDescSaving(true)
    await updateTacticDescription(map, side, zone, tactic.id, desc.trim())
    setDescSaving(false)
    setDescEdit(false)
  }

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeGrenades(map, side, zone, tactic.id, data => {
      setGrenades(data)
      setLoading(false)
    })
    return unsub
  }, [map, side, zone, tactic.id])

  async function handleAdd(data) {
    setSaving(true)
    await addGrenade(map, side, zone, tactic.id, data)
    setSaving(false)
    setAddOpen(false)
  }

  async function handleEdit(data) {
    setSaving(true)
    await updateGrenade(map, side, zone, tactic.id, editTarget.id, data)
    setSaving(false)
    setEditTarget(null)
  }

  async function handleDelete(grenadeId) {
    if (!confirm('Poistetaanko kranaatti?')) return
    await deleteGrenade(map, side, zone, tactic.id, grenadeId)
  }

  const sideColor = side === 'T' ? 'var(--t-color)' : 'var(--ct-color)'

  return (
    <div style={styles.wrap}>
      <button style={styles.backBtn} onClick={onBack}>← Takaisin</button>
      <h1 style={styles.title}>{tactic.name}</h1>
      <p style={{ ...styles.sub, color: sideColor }}>{side}-puoli · {zone} · {map}</p>

      {/* Description block */}
      <div style={styles.descBlock}>
        {descEdit ? (
          <div style={styles.descEditWrap}>
            <textarea
              ref={descRef}
              style={styles.descTextarea}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Kirjoita taktiikan kuvaus..."
              rows={3}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSaveDesc() }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button style={styles.descBtnCancel} onClick={() => { setDescEdit(false); setDesc(tactic.description || '') }}>Peruuta</button>
              <button style={styles.descBtnSave} onClick={handleSaveDesc} disabled={descSaving}>
                {descSaving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        ) : desc ? (
          <div style={styles.descView} onClick={() => setDescEdit(true)}>
            <span style={styles.descText}>{desc}</span>
            <span style={styles.descEditIcon}>✏</span>
          </div>
        ) : (
          <button style={styles.descAddBtn} onClick={() => setDescEdit(true)}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            Lisää kuvaus taktiikalle
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.loader}><div style={styles.spinner} /></div>
      ) : grenades.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>💣</div>
          <div>Ei vielä kranaatteja</div>
        </div>
      ) : (
        grenades.map(g => {
          const typeInfo = GRENADE_TYPES.find(t => t.key === g.type) || GRENADE_TYPES[0]
          const imgs = (g.images || []).filter(Boolean)
          return (
            <div key={g.id} style={styles.card} className="animate-fadeIn">
              <div style={styles.cardHeader}>
                <span style={{ ...styles.badge, color: typeInfo.color, background: typeInfo.bg, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <img src={typeInfo.icon} alt="" style={{ width: '14px', height: '14px' }} />
                  {typeInfo.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={styles.editBtn} onClick={() => setEditTarget(g)}>Muokkaa</button>
                  <button style={styles.delBtn} onClick={() => handleDelete(g.id)}>Poista</button>
                </div>
              </div>
              {imgs.length > 0 && (
                <div style={{ ...styles.imgGrid, gridTemplateColumns: `repeat(${imgs.length}, 1fr)` }}>
                  {imgs.map((src, i) => (
                    <img
                      key={i} src={src} alt=""
                      style={{ ...styles.img, cursor: 'zoom-in' }}
                      onClick={() => openLightbox(imgs, i)}
                    />
                  ))}
                </div>
              )}
              {g.note && <div style={styles.note}>{g.note}</div>}
            </div>
          )
        })
      )}

      <button style={styles.addBtn} onClick={() => setAddOpen(true)}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
        Lisää kranaatti
      </button>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Lisää kranaatti">
        <GrenadeForm onSave={handleAdd} onCancel={() => setAddOpen(false)} saving={saving} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Muokkaa kranaattia">
        {editTarget && (
          <GrenadeForm
            initialType={editTarget.type}
            initialNote={editTarget.note}
            initialImages={editTarget.images}
            onSave={handleEdit}
            onCancel={() => setEditTarget(null)}
            saving={saving}
          />
        )}
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={lb.overlay}
          onClick={() => setLightbox(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setLightbox(null)
            if (e.key === 'ArrowRight') setLightbox(l => ({ ...l, idx: Math.min(l.idx + 1, l.srcs.length - 1) }))
            if (e.key === 'ArrowLeft') setLightbox(l => ({ ...l, idx: Math.max(l.idx - 1, 0) }))
          }}
          tabIndex={0}
          autoFocus
        >
          <img
            src={lightbox.srcs[lightbox.idx]}
            alt=""
            style={lb.img}
            onClick={e => e.stopPropagation()}
          />
          {lightbox.srcs.length > 1 && (
            <>
              <button style={{ ...lb.arrow, left: '12px' }}
                onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: Math.max(l.idx - 1, 0) })) }}
                disabled={lightbox.idx === 0}
              >‹</button>
              <button style={{ ...lb.arrow, right: '12px' }}
                onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: Math.min(l.idx + 1, l.srcs.length - 1) })) }}
                disabled={lightbox.idx === lightbox.srcs.length - 1}
              >›</button>
              <div style={lb.dots}>
                {lightbox.srcs.map((_, i) => (
                  <div key={i} style={{ ...lb.dot, background: i === lightbox.idx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            </>
          )}
          <button style={lb.close} onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrap: { paddingTop: '4px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '14px', padding: '0 0 16px', cursor: 'pointer' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  sub: { fontSize: '13px', marginBottom: '20px' },
  loader: { textAlign: 'center', padding: '32px' },
  spinner: { width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' },
  emptyIcon: { fontSize: '32px', marginBottom: '10px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '12px' },
  cardHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' },
  badge: { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' },
  editBtn: { padding: '5px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer' },
  delBtn: { padding: '5px 10px', borderRadius: 'var(--radius)', border: '1px solid rgba(224,85,85,0.3)', background: 'transparent', color: 'var(--t-color)', fontSize: '12px', cursor: 'pointer' },
  imgGrid: { display: 'grid', gap: '2px', padding: '0 2px 2px' },
  img: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', borderRadius: '4px' },
  note: { padding: '12px 16px', fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' },
  addBtn: { width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' },
  typeGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  typeBtn: { padding: '7px 14px', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' },
  imgUploadGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' },
  imgSlot: { aspectRatio: '1', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border2)', background: 'var(--surface2)', position: 'relative', overflow: 'hidden', transition: 'outline 0.1s' },
  imgSlotLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', cursor: 'pointer', gap: '2px' },
  imgSlotPreview: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  imgSlotActions: { position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', zIndex: 2 },
  imgActionBtn: { width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dragHandle: { position: 'absolute', bottom: '4px', right: '4px', zIndex: 2, color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'grab', userSelect: 'none' },
  textarea: { width: '100%', padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', resize: 'none', outline: 'none' },
  charCount: { fontSize: '11px', color: 'var(--text3)', textAlign: 'right', marginTop: '4px' },
  descBlock: { marginBottom: '20px' },
  descAddBtn: {
    width: '100%', padding: '10px 14px',
    borderRadius: 'var(--radius)', border: '1px dashed var(--border2)',
    background: 'transparent', color: 'var(--text3)', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  descView: {
    padding: '12px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--surface)',
    cursor: 'pointer', display: 'flex', alignItems: 'flex-start',
    gap: '8px', transition: 'border-color 0.15s',
  },
  descText: { flex: 1, fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  descEditIcon: { fontSize: '12px', color: 'var(--text3)', flexShrink: 0, marginTop: '2px' },
  descEditWrap: {},
  descTextarea: {
    width: '100%', padding: '11px 14px',
    background: 'var(--surface2)', border: '1px solid var(--accent)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '13px',
    resize: 'none', outline: 'none', lineHeight: '1.6',
  },
  descBtnCancel: {
    padding: '7px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text2)', fontSize: '13px', cursor: 'pointer',
  },
  descBtnSave: {
    padding: '7px 14px', borderRadius: 'var(--radius)',
    border: 'none', background: 'var(--accent)',
    color: '#0d0d0d', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
}

// ── Crop styles ───────────────────────────────────────────────────────────────
const cs = {
  cropOverlay: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  cropBox: { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border2)', width: '100%', maxWidth: '600px', overflow: 'hidden' },
  cropHeader: { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cropTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
  cropHint: { fontSize: '12px', color: 'var(--text3)' },
  cropImgWrap: { position: 'relative', cursor: 'crosshair', userSelect: 'none', background: '#000', maxHeight: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cropImg: { maxWidth: '100%', maxHeight: '60vh', display: 'block', pointerEvents: 'none' },
  cropActions: { padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' },
  cropBtnCancel: { padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  cropBtnSkip: { padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontSize: '13px', cursor: 'pointer' },
  cropBtnApply: { padding: '8px 14px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: '#0d0d0d', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
}

// ── Lightbox styles ───────────────────────────────────────────────────────────
const lb = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 400,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.15s ease', outline: 'none',
  },
  img: {
    maxWidth: '95vw', maxHeight: '90vh',
    objectFit: 'contain', borderRadius: '4px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  close: {
    position: 'fixed', top: '16px', right: '16px',
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', border: 'none',
    color: '#fff', fontSize: '22px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  arrow: {
    position: 'fixed', top: '50%', transform: 'translateY(-50%)',
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', border: 'none',
    color: '#fff', fontSize: '28px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '6px',
  },
  dot: { width: '7px', height: '7px', borderRadius: '50%', transition: 'background 0.15s' },
}
