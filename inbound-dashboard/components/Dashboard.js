import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'

function fmtNum(n) { return typeof n === 'number' ? n : parseFloat(n) || 0 }
function pct(val, max) { return max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0 }

// Pill badge
function Badge({ children, color }) {
  const colors = {
    green:  { background: '#d4edda', color: '#1a6630' },
    red:    { background: '#f8d7da', color: '#8b1a1a' },
    orange: { background: '#fff3cd', color: '#7d5a00' },
    gray:   { background: '#e9ecef', color: '#495057' },
    greenSolid: { background: '#28a745', color: '#fff' },
    redSolid:   { background: '#dc3545', color: '#fff' },
    orangeSolid:{ background: '#f0ad4e', color: '#fff' },
  }
  const c = colors[color] || colors.gray
  return (
    <span style={{
      ...c, borderRadius: 4, padding: '2px 8px',
      fontSize: 11, fontWeight: 700, display: 'inline-block'
    }}>{children}</span>
  )
}

// Donut SVG
function Donut({ received, expected }) {
  const p = pct(received, expected)
  const r = 40, circ = 2 * Math.PI * r
  const fill = circ * (p / 100)
  const color = p >= 100 ? '#28a745' : p >= 80 ? '#f0ad4e' : '#dc3545'
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e9ecef" strokeWidth="16" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="16"
        strokeDasharray={`${fill.toFixed(1)} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 55 55)" />
      <text x="55" y="50" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1a2e5a" fontFamily="Montserrat">{p}%</text>
      <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#888" fontFamily="Montserrat">Reçu {received}/{expected}</text>
    </svg>
  )
}

// Progress bar
function ProgressBar({ value, target, color }) {
  const w = Math.min(100, Math.round((value / (target || 100)) * 100))
  return (
    <div style={{ position: 'relative', background: '#e9ecef', borderRadius: 20, height: 6, width: '100%', margin: '4px 0' }}>
      <div style={{ width: `${w}%`, height: '100%', background: color || '#1a2e5a', borderRadius: 20 }} />
      <div style={{ position: 'absolute', top: -4, left: `${Math.min(97, target)}%`, height: 14, width: 2, background: '#555' }} />
    </div>
  )
}

// Card
function Card({ title, children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, border: '1px solid #dde3ee',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', ...style
    }}>
      <div style={{
        background: '#1a2e5a', color: '#7ec8e3', fontSize: 10,
        fontWeight: 700, textAlign: 'center', padding: '6px 10px',
        letterSpacing: '.08em', textTransform: 'uppercase', fontStyle: 'italic'
      }}>{title}</div>
      <div style={{ padding: '10px 12px' }}>{children}</div>
    </div>
  )
}

// Row
function Row({ label, value, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 11, color: '#555', padding: '2px 0', borderBottom: '0.5px solid #f0f0f0'
    }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, color: '#1a2e5a' }}>{value}</span>
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
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setRefreshIn(s => s <= 1 ? 60 : s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const dlc = new Date(time.getTime() + 6 * 24 * 3600000)
  const dlcStr = `${String(dlc.getDate()).padStart(2,'0')}/${String(dlc.getMonth()+1).padStart(2,'0')}/${dlc.getFullYear()}`

  const base = {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: "'Montserrat', sans-serif",
    padding: 10,
  }

  if (loading) return (
    <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#1a2e5a', fontWeight: 600 }}>Connexion à Google Sheets…</div>
    </div>
  )

  if (error) return (
    <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center' }}>
        <div style={{ color: '#dc3545', fontWeight: 700, marginBottom: 12 }}>{error}</div>
        <button onClick={fetchData} style={{ background: '#1a2e5a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Montserrat' }}>Réessayer</button>
      </div>
    </div>
  )

  const { po = {}, rate = {}, lti = {}, abs = {}, otif = {}, gmp = {}, errorRate = {}, hotPO = [], pendingUnload = [], unreceived = [] } = data || {}

  const poExp = fmtNum(po.expected)
  const poRec = fmtNum(po.received)
  const poRem = fmtNum(po.remaining)
  const ratePlanned = fmtNum(rate.planned)
  const rateActual = fmtNum(rate.actual)
  const ecart = Math.round(rateActual - ratePlanned)
  const ltiDays = fmtNum(lti.days)
  const otifVal = fmtNum(otif.val)
  const gmpVal = fmtNum(gmp.val)
  const errVal = fmtNum(errorRate.val)
  const errPrev = fmtNum(errorRate.prev)
  const errTrend = errorRate.trend || ''

  const amPlanned = fmtNum(abs.amPlanned)
  const amActual = fmtNum(abs.amActual)
  const amAbs = abs.amAbs || ((amPlanned > 0 ? ((Math.abs(amPlanned - amActual) / amPlanned) * 100).toFixed(2) : '0.00') + '%')
  const pmPlanned = fmtNum(abs.pmPlanned)
  const pmActual = fmtNum(abs.pmActual)
  const pmAbs = abs.pmAbs || ((pmPlanned > 0 ? ((Math.abs(pmPlanned - pmActual) / pmPlanned) * 100).toFixed(2) : '0.00') + '%')

  const bigNum = { fontSize: 28, fontWeight: 700, color: '#1a2e5a', lineHeight: 1 }
  const muted = { fontSize: 10, color: '#888' }
  const sectionLbl = { fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', margin: '5px 0 2px' }

  const statusColor = (s) => {
    const sl = String(s).toLowerCase()
    if (sl.includes('unload') || sl.includes('déchargé') || sl.includes('ok')) return 'greenSolid'
    if (sl.includes('pending') || sl.includes('attente')) return 'orangeSolid'
    return 'redSolid'
  }

  return (
    <div style={base}>
      {/* HEADER */}
      <div style={{
        background: '#1a2e5a', borderRadius: 8, padding: '6px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#5a9e2f', borderRadius: 6, padding: '4px 8px',
            color: '#fff', fontWeight: 900, fontSize: 12, lineHeight: 1.2
          }}>HELLO<br/>FRESH</div>
          <div style={{ color: '#7ec8e3', fontSize: 16, fontWeight: 700, fontStyle: 'italic', letterSpacing: '.04em' }}>
            DASHBOARD INBOUND
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,.13)', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff' }}>
            📅 DLC PHF : {dlcStr}
          </span>
          <span style={{ background: '#5a9e2f', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
            ⏱ {hh}:{mm}
          </span>
          <span style={{ background: 'rgba(255,255,255,.13)', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff' }}>
            ⟳ {refreshIn}s
          </span>
          <button onClick={fetchData} style={{ background: 'rgba(255,255,255,.13)', border: 'none', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Montserrat' }}>
            Actualiser
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Montserrat' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr 210px', gap: 8, marginBottom: 8 }}>

        {/* PO INBOUND */}
        <Card title="PO Inbound">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Donut received={poRec} expected={poExp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: 10, borderTop: '1px solid #eee', paddingTop: 6, width: '100%', gap: 4 }}>
              <div><div style={muted}>Attendu</div><div style={{ fontWeight: 700, color: '#1a2e5a', fontSize: 14 }}>{poExp}</div></div>
              <div><div style={muted}>Reçu</div><div style={{ fontWeight: 700, color: '#1a2e5a', fontSize: 14 }}>{poRec}</div></div>
              <div><div style={muted}>Restant</div><div style={{ fontWeight: 700, color: poRem > 0 ? '#dc3545' : '#28a745', fontSize: 14 }}>{poRem}</div></div>
            </div>
          </div>
        </Card>

        {/* HOT PO */}
        <Card title="Hot PO">
          {hotPO.length === 0
            ? <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Pas de PRIO</div>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr>
                    {['Fournisseur','PO','Statut'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #eee', color: '#888', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hotPO.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 4px', color: '#555', borderBottom: '1px solid #f5f5f5', fontSize: 10 }}>{row.supplier}</td>
                      <td style={{ padding: '3px 4px', color: '#555', borderBottom: '1px solid #f5f5f5', fontSize: 10 }}>{row.po}</td>
                      <td style={{ padding: '3px 4px', borderBottom: '1px solid #f5f5f5' }}>
                        <Badge color={statusColor(row.status)}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>

        {/* PENDING UNLOAD */}
        <Card title="Reste à décharger">
          {pendingUnload.length === 0
            ? <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun en attente</div>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr>
                    {['Quai','Fournisseur'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #eee', color: '#888', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingUnload.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 4px', color: '#1a2e5a', fontWeight: 600, borderBottom: '1px solid #f5f5f5' }}>{row.quai}</td>
                      <td style={{ padding: '3px 4px', color: '#555', borderBottom: '1px solid #f5f5f5' }}>{row.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>

        {/* UNRECEIVED PO */}
        <Card title="Non réceptionné">
          {unreceived.length === 0
            ? <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun PO en attente</div>
            : <div>
                {unreceived.map((row, i) => (
                  <div key={i} style={{ background: '#fde8e8', borderRadius: 4, padding: '3px 8px', marginBottom: 3, fontSize: 10, color: '#8b1a1a', fontWeight: 600 }}>
                    {row.supplier}{row.po ? ` — ${row.po}` : ''}
                  </div>
                ))}
              </div>
          }
        </Card>

        {/* INBOUND RATE */}
        <Card title="Rythme réception">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, height: 90, marginBottom: 8 }}>
            {[
              { label: 'Attendu', val: ratePlanned, color: '#7ec8e3' },
              { label: 'Réel', val: rateActual, color: '#1a2e5a' }
            ].map(({ label, val, color }) => {
              const maxVal = Math.max(ratePlanned, rateActual) || 1
              const h = Math.round((val / maxVal) * 75)
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 40, height: h, background: color, borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: color === '#7ec8e3' ? '#1a2e5a' : '#fff' }}>{Math.round(val)}</span>
                  </div>
                  <span style={{ fontSize: 9, color: '#888' }}>{label}</span>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              background: ecart >= 0 ? '#d4edda' : '#f8d7da',
              color: ecart >= 0 ? '#1a6630' : '#8b1a1a',
              borderRadius: 5, padding: '3px 12px', fontSize: 12, fontWeight: 700
            }}>
              Écart : {ecart >= 0 ? '+' : ''}{ecart}
            </span>
          </div>
        </Card>
      </div>

      {/* ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr 210px', gap: 8 }}>

        {/* LTI */}
        <Card title="LTI — Sécurité">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #eee' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a2e5a' }}>LTI (Cette année) :</span>
            <Badge color={fmtNum(lti.year) === 0 ? 'greenSolid' : 'redSolid'}>{lti.year}</Badge>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a2e5a', marginBottom: 4 }}>JOURS SANS LTI :</div>
          <div style={{ background: '#d4edda', borderRadius: 8, textAlign: 'center', padding: '8px 0', marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a6630' }}>{ltiDays}</div>
          </div>
          <div style={{ fontSize: 10, color: '#888' }}>Dernier LTI : <strong>{lti.lastDate}</strong></div>
        </Card>

        {/* ABSENTEEISM */}
        <Card title="Taux d'absentéisme">
          <div style={sectionLbl}>AM</div>
          <Row label="Prévu" value={amPlanned} bold />
          <Row label="Réel" value={amActual} bold />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: '#888' }}>Absent</span>
            <Badge color={parseFloat(amAbs) > 10 ? 'redSolid' : parseFloat(amAbs) > 5 ? 'orangeSolid' : 'greenSolid'}>
              {typeof amAbs === 'string' ? amAbs : amAbs + '%'}
            </Badge>
          </div>
          <div style={sectionLbl}>PM</div>
          <Row label="Prévu" value={pmPlanned} bold />
          <Row label="Réel" value={pmActual} bold />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
            <span style={{ fontSize: 10, color: '#888' }}>Absent</span>
            <Badge color={parseFloat(pmAbs) > 10 ? 'redSolid' : parseFloat(pmAbs) > 5 ? 'orangeSolid' : 'greenSolid'}>
              {typeof pmAbs === 'string' ? pmAbs : pmAbs + '%'}
            </Badge>
          </div>
        </Card>

        {/* OTIF */}
        <Card title="OTIF Inbound">
          <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 2 }}>Current Day</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: otifVal >= 90 ? '#1a6630' : '#dc3545', textAlign: 'center', fontStyle: 'italic', marginBottom: 4 }}>
            {otifVal}%
          </div>
          {otifVal < 90 && <div style={{ fontSize: 9, color: '#dc3545', textAlign: 'center', marginBottom: 4 }}>⚠ Below target &lt; 90%</div>}
          <ProgressBar value={otifVal} target={90} color={otifVal >= 90 ? '#28a745' : '#dc3545'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#888', marginBottom: 8 }}>
            <span>0%</span><span style={{ color: '#28a745', fontWeight: 600 }}>90% Target</span>
          </div>
          <Row label="On time" value={`${otif.onTime || 0}%`} bold />
          <Row label="In full" value={`${otif.inFull || 0}%`} bold />
        </Card>

        {/* GMP */}
        <Card title="GMP">
          <div style={{ fontSize: 34, fontWeight: 700, color: gmpVal >= 95 ? '#1a6630' : '#f0ad4e', textAlign: 'center', fontStyle: 'italic', marginBottom: 4 }}>
            {gmpVal}%
          </div>
          {gmpVal < 95 && <div style={{ fontSize: 9, color: '#dc3545', textAlign: 'center', marginBottom: 4 }}>⚠ Sous la cible (95%)</div>}
          <ProgressBar value={gmpVal} target={95} color={gmpVal >= 95 ? '#28a745' : '#f0ad4e'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#888', marginBottom: 8 }}>
            <span>0%</span>
            <span style={{ color: '#f0ad4e', fontWeight: 600 }}>{gmpVal}% actuel</span>
            <span style={{ color: '#28a745', fontWeight: 600 }}>95% cible</span>
          </div>
          <Row label={`W${new Date().getWeek ? new Date().getWeek() - 1 : 'préc.'}`} value={`${gmp.prev || 0}%`} bold />
        </Card>

        {/* ERROR RATE */}
        <Card title="Error Rate INB">
          <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 2 }}>Semaine en cours</div>
          <div style={{ fontSize: 30, fontWeight: 700, fontStyle: 'italic', textAlign: 'center', color: errVal < 1 ? '#1a6630' : '#dc3545', marginBottom: 4 }}>
            {errVal.toFixed(2).replace('.', ',')}%
          </div>
          <div style={{ fontSize: 9, color: errVal < 1 ? '#28a745' : '#dc3545', textAlign: 'center', marginBottom: 8 }}>
            {errVal < 1 ? '✅ Objectif atteint < 1%' : '⚠ Au-dessus de la cible'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', paddingTop: 6, borderTop: '1px solid #eee' }}>
            <span style={{ color: '#888' }}>Sem. préc.</span>
            <span style={{ fontWeight: 700 }}>
              {errPrev.toFixed(2).replace('.', ',')}%
              {errTrend ? <span style={{ fontSize: 9, color: '#888', marginLeft: 4 }}>↑ {errTrend}</span> : ''}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}