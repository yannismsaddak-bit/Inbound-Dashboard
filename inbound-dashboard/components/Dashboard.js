import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'

function fmtNum(n) { return typeof n === 'number' ? n : parseFloat(n) || 0 }
function fmtPct(n) { return (fmtNum(n) * 100).toFixed(1) + '%' }
function pct(val, max) { return max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0 }

const S = {
  db: { background: '#f0f2f5', padding: 10, minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  hdr: { background: '#1a2e5a', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  hdrLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { background: '#5a9e2f', borderRadius: 6, padding: '4px 8px', color: '#fff', fontWeight: 700, fontSize: 12, lineHeight: 1.2 },
  hdrTitle: { color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '.04em' },
  hdrMeta: { display: 'flex', gap: 10, alignItems: 'center' },
  chip: { background: 'rgba(255,255,255,.13)', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 500 },
  chipGreen: { background: '#5a9e2f', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 500 },
  gridTop: { display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 200px', gap: 8, marginBottom: 8 },
  gridBot: { display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 200px', gap: 8, marginBottom: 8 },
  card: { background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #e0e4ea' },
  cardTitle: { fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a2e5a', marginBottom: 8, borderBottom: '2px solid #1a2e5a', paddingBottom: 4 },
  abRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#555', padding: '2px 0', borderBottom: '0.5px solid #f0f0f0' },
  muted: { fontSize: 10, color: '#888' },
  bigNum: { fontSize: 28, fontWeight: 700, color: '#1a2e5a', lineHeight: 1 },
  sectionLbl: { fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', margin: '5px 0 2px' },
  progressBg: { background: '#e9ecef', borderRadius: 20, height: 5, width: '100%', marginTop: 4 },
  comment: { background: '#1a2e5a', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 },
}

function pill(text, type) {
  const colors = {
    green: { background: '#d4edda', color: '#1a6630' },
    red: { background: '#f8d7da', color: '#8b1a1a' },
    amber: { background: '#fff3cd', color: '#7d5a00' },
    gray: { background: '#e9ecef', color: '#495057' },
  }
  const c = colors[type] || colors.gray
  return <span style={{ ...c, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{text}</span>
}

function trendChip(text, type) {
  const colors = {
    up: { background: '#d4edda', color: '#1a6630' },
    down: { background: '#f8d7da', color: '#8b1a1a' },
    flat: { background: '#e9ecef', color: '#495057' },
  }
  const c = colors[type] || colors.flat
  return <span style={{ ...c, display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{text}</span>
}

function Donut({ received, expected }) {
  const p = pct(received, expected)
  const r = 40, circ = 2 * Math.PI * r
  const fill = circ * (p / 100)
  const color = p >= 100 ? '#5a9e2f' : p >= 80 ? '#f0ad4e' : '#dc3545'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e9ecef" strokeWidth="14" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${fill.toFixed(1)} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 50 50)" />
      <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1a2e5a">{p}%</text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#888">{received}/{expected}</text>
    </svg>
  )
}

function ProgressBar({ value, target, color }) {
  const w = Math.min(100, Math.round((value / (target || 100)) * 100))
  return (
    <div style={S.progressBg}>
      <div style={{ width: `${w}%`, height: 5, borderRadius: 20, background: color || '#1a2e5a' }} />
    </div>
  )
}

export default function Dashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [time, setTime] = useState(new Date())
  const [refreshIn, setRefreshIn] = useState(60)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Erreur API')
      setData(await res.json())
      setRefreshIn(60)
    } catch (e) {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const t = setInterval(() => setRefreshIn(s => s <= 1 ? 60 : s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const dlc = new Date(time.getTime() + 6 * 24 * 3600000)
  const dlcStr = `${String(dlc.getDate()).padStart(2, '0')}/${String(dlc.getMonth() + 1).padStart(2, '0')}/${dlc.getFullYear()}`

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#1a2e5a', fontWeight: 700 }}>Connexion à Google Sheets…</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, textAlign: 'center' }}>
        <div style={{ color: '#dc3545', fontWeight: 700, marginBottom: 12 }}>{error}</div>
        <button onClick={fetchData} style={{ background: '#1a2e5a', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer' }}>Réessayer</button>
      </div>
    </div>
  )

  const { po = {}, rate = {}, lti = {}, abs = {}, otif = {}, gmp = {}, errorRate = {}, hotPO = [], pendingUnload = [], unreceived = [] } = data || {}

  const poExp = fmtNum(po.expected)
  const poRec = fmtNum(po.received)
  const poRem = fmtNum(po.remaining)
  const ratePlanned = fmtNum(rate.planned)
  const rateActual = fmtNum(rate.actual)
  const ecart = rateActual - ratePlanned
  const otifVal = fmtNum(otif.val)
  const gmpVal = fmtNum(gmp.val)
  const errVal = parseFloat(String(errorRate.val).replace(',', '.')) || 0
  const ltiDays = fmtNum(lti.days)

  const amPlanned = fmtNum(abs.amPlanned)
  const amActual = fmtNum(abs.amActual)
  const pmPlanned = fmtNum(abs.pmPlanned)
  const pmActual = fmtNum(abs.pmActual)
  const amAbsPct = amPlanned > 0 ? ((Math.abs(amPlanned - amActual) / amPlanned) * 100).toFixed(2) : '0.00'
  const pmAbsPct = pmPlanned > 0 ? ((Math.abs(pmPlanned - pmActual) / pmPlanned) * 100).toFixed(2) : '0.00'

  return (
    <div style={S.db}>
      {/* Header */}
      <div style={S.hdr}>
        <div style={S.hdrLeft}>
          <div style={S.logo}>HELLO<br />FRESH</div>
          <div style={S.hdrTitle}>DASHBOARD INBOUND</div>
        </div>
        <div style={S.hdrMeta}>
          <span style={S.chip}>📅 DLC PHF : {dlcStr}</span>
          <span style={S.chipGreen}>⏱ {hh}:{mm}</span>
          <span style={S.chip}>🎯 Complétion : {pct(poRec, poExp)}%</span>
          <span style={S.chip}>🔒 LTI : {ltiDays} jours</span>
          <span style={S.chip}>⟳ {refreshIn}s</span>
          <button onClick={fetchData} style={{ background: 'rgba(255,255,255,.13)', border: 'none', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>Actualiser</button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </div>

      {/* Row 1 */}
      <div style={S.gridTop}>

        {/* PO Inbound */}
        <div style={S.card}>
          <div style={S.cardTitle}>Nbre de réception</div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 6px' }}>
            <Donut received={poRec} expected={poExp} />
          </div>
          <div style={S.abRow}><span style={S.muted}>Attendus</span><b>{poExp}</b></div>
          <div style={S.abRow}><span style={S.muted}>Reçus</span>{pill(poRec, poRec >= poExp ? 'green' : 'amber')}</div>
          <div style={{ ...S.abRow, borderBottom: 'none' }}><span style={S.muted}>Restant</span>{pill(poRem, poRem === 0 ? 'green' : 'red')}</div>
        </div>

        {/* Hot PO */}
        <div style={S.card}>
          <div style={S.cardTitle}>Prio PO</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr>
                <th style={{ color: '#888', fontWeight: 600, textAlign: 'left', padding: '2px 3px', borderBottom: '1px solid #eee' }}>Fournisseur</th>
                <th style={{ color: '#888', fontWeight: 600, textAlign: 'left', padding: '2px 3px', borderBottom: '1px solid #eee' }}>PO</th>
                <th style={{ color: '#888', fontWeight: 600, textAlign: 'left', padding: '2px 3px', borderBottom: '1px solid #eee' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {hotPO.length === 0
                ? <tr><td colSpan={3} style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Pas de PRIO</td></tr>
                : hotPO.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '2px 3px', color: '#555' }}>{row.supplier}</td>
                    <td style={{ padding: '2px 3px', color: '#555' }}>{row.po}</td>
                    <td style={{ padding: '2px 3px' }}>{pill(row.status, row.status === 'OK' ? 'green' : 'red')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid #eee' }}>
            <span style={S.muted}>Total PRIO actifs</span>
            {pill(hotPO.length, hotPO.length === 0 ? 'green' : 'red')}
          </div>
        </div>

        {/* Pending Unload */}
        <div style={S.card}>
          <div style={S.cardTitle}>Reste à décharger</div>
          {pendingUnload.length === 0
            ? <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun en attente</div>
            : pendingUnload.map((item, i) => (
              <div key={i} style={{ background: '#f0f5ff', borderRadius: 4, padding: '3px 8px', marginBottom: 3, fontSize: 10, color: '#1a2e5a', fontWeight: 600 }}>{item}</div>
            ))
          }
          <div style={{ ...S.abRow, borderBottom: 'none', marginTop: 6 }}>
            <span style={S.muted}>Total à décharger</span>
            {pill(pendingUnload.length, pendingUnload.length === 0 ? 'green' : 'amber')}
          </div>
        </div>

        {/* Unreceived PO */}
        <div style={S.card}>
          <div style={S.cardTitle}>Non réceptionné</div>
          {unreceived.length === 0
            ? <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun PO en attente</div>
            : unreceived.map((item, i) => (
              <div key={i} style={{ background: '#f8d7da', borderRadius: 4, padding: '3px 8px', marginBottom: 3, fontSize: 10, color: '#8b1a1a', fontWeight: 600 }}>{item}</div>
            ))
          }
          {unreceived.length > 0 && (
            <div style={{ ...S.abRow, borderBottom: 'none', marginTop: 6 }}>
              <span style={S.muted}>Total non reçus</span>
              {pill(unreceived.length, 'red')}
            </div>
          )}
        </div>

        {/* Inbound Rate */}
        <div style={S.card}>
          <div style={S.cardTitle}>Rythme réception</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 80, marginBottom: 6 }}>
            {[{ label: 'Attendu', val: ratePlanned, color: '#a8c4e0' }, { label: 'Réel', val: rateActual, color: '#1a2e5a' }].map(({ label, val, color }) => {
              const maxVal = Math.max(ratePlanned, rateActual)
              const h = Math.round((val / (maxVal || 1)) * 70)
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 36, height: h, background: color, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: color === '#a8c4e0' ? '#1a2e5a' : '#fff' }}>{Math.round(val)}</span>
                  </div>
                  <span style={{ fontSize: 9, color: '#888' }}>{label}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {trendChip(`${ecart >= 0 ? '▲' : '▼'} Écart: ${ecart >= 0 ? '+' : ''}${Math.round(ecart)}`, ecart >= 0 ? 'up' : 'down')}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div style={S.gridBot}>

        {/* LTI */}
        <div style={S.card}>
          <div style={S.cardTitle}>LTI — Sécurité</div>
          <div style={{ textAlign: 'center', background: '#d4edda', borderRadius: 6, padding: 8, marginBottom: 6 }}>
            <div style={{ ...S.bigNum, color: '#1a6630' }}>{ltiDays}</div>
            <div style={{ fontSize: 9, color: '#1a6630', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>jours sans LTI</div>
          </div>
          <div style={S.abRow}><span style={S.muted}>LTI cette année</span>{pill(fmtNum(lti.year), fmtNum(lti.year) === 0 ? 'green' : 'red')}</div>
          <div style={{ ...S.abRow, borderBottom: 'none' }}><span style={S.muted}>Dernier LTI</span><span style={{ fontSize: 10, color: '#888' }}>{lti.lastDate}</span></div>
        </div>

        {/* Absenteeism */}
        <div style={S.card}>
          <div style={S.cardTitle}>Taux d'absentéisme</div>
          <div style={S.sectionLbl}>AM</div>
          <div style={S.abRow}><span style={S.muted}>Prévu</span><b>{amPlanned}</b></div>
          <div style={S.abRow}><span style={S.muted}>Réel</span><b>{amActual}</b></div>
          <div style={S.abRow}><span style={S.muted}>Absent</span>{pill(`${amAbsPct}%`, parseFloat(amAbsPct) > 10 ? 'red' : parseFloat(amAbsPct) > 5 ? 'amber' : 'green')}</div>
          <div style={{ height: 6 }} />
          <div style={S.sectionLbl}>PM</div>
          <div style={S.abRow}><span style={S.muted}>Prévu</span><b>{pmPlanned}</b></div>
          <div style={S.abRow}><span style={S.muted}>Réel</span><b>{pmActual}</b></div>
          <div style={{ ...S.abRow, borderBottom: 'none' }}><span style={S.muted}>Absent</span>{pill(`${pmAbsPct}%`, parseFloat(pmAbsPct) > 10 ? 'red' : parseFloat(pmAbsPct) > 5 ? 'amber' : 'green')}</div>
        </div>

        {/* OTIF */}
        <div style={S.card}>
          <div style={S.cardTitle}>OTIF Inbound</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ ...S.bigNum, color: otifVal >= 90 ? '#1a6630' : '#7d5a00' }}>{otifVal}%</div>
            {trendChip(otifVal >= 90 ? '✓ Objectif' : '⚠ Sous cible', otifVal >= 90 ? 'up' : 'down')}
          </div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Jour en cours</div>
          <ProgressBar value={otifVal} target={90} color={otifVal >= 90 ? '#5a9e2f' : '#f0ad4e'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 2 }}>
            <span style={S.muted}>0%</span>
            <span style={{ color: '#5a9e2f', fontWeight: 600 }}>90% cible</span>
          </div>
          <div style={{ ...S.abRow, marginTop: 6 }}><span style={S.muted}>On time</span><b>{fmtNum(otif.onTime)}%</b></div>
          <div style={{ ...S.abRow, borderBottom: 'none' }}><span style={S.muted}>In full</span><b>{fmtNum(otif.inFull)}%</b></div>
        </div>

        {/* GMP */}
        <div style={S.card}>
          <div style={S.cardTitle}>Audit GMP Inbound</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ ...S.bigNum, color: gmpVal >= 95 ? '#1a6630' : '#7d5a00' }}>{gmpVal}%</div>
            {trendChip(gmpVal >= 95 ? '✓ Objectif' : '⚠ Sous cible', gmpVal >= 95 ? 'up' : 'flat')}
          </div>
          <div style={{ fontSize: 10, color: gmpVal < 95 ? '#8b1a1a' : '#1a6630', marginBottom: 6, fontWeight: 500 }}>
            {gmpVal < 95 ? '⚠ Sous la cible (95%)' : '✓ Objectif atteint'}
          </div>
          <ProgressBar value={gmpVal} target={95} color={gmpVal >= 95 ? '#5a9e2f' : '#f0ad4e'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 2 }}>
            <span style={S.muted}>0%</span>
            <span style={{ color: gmpVal >= 95 ? '#5a9e2f' : '#f0ad4e', fontWeight: 600 }}>{gmpVal}% actuel</span>
            <span style={{ color: '#5a9e2f', fontWeight: 600 }}>95% cible</span>
          </div>
        </div>

        {/* Error Rate */}
        <div style={S.card}>
          <div style={S.cardTitle}>Error rate inbound</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ ...S.bigNum, color: errVal < 1 ? '#1a6630' : '#8b1a1a' }}>{errVal.toFixed(2).replace('.', ',')}%</div>
            {trendChip(errVal < 1 ? '→ stable' : '▲ alerte', errVal < 1 ? 'flat' : 'down')}
          </div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Semaine en cours</div>
          <ProgressBar value={errVal} target={1} color={errVal < 1 ? '#5a9e2f' : '#dc3545'} />
          <div style={{ fontSize: 9, color: '#5a9e2f', marginTop: 2, fontWeight: 600 }}>
            {errVal < 1 ? '✓ Objectif atteint (cible < 1%)' : '⚠ Au-dessus de la cible'}
          </div>
        </div>
      </div>

      {/* Comment bar */}
      <div style={S.comment}>
        <span style={{ fontSize: 16 }}>💬</span>
        <span style={{ color: '#fff', fontSize: 12, fontStyle: 'italic', opacity: .85 }}>
          Commentaire opérationnel — {user?.email}
        </span>
      </div>
    </div>
  )
}