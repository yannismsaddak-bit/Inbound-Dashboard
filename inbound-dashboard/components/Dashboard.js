import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'

function pct(val, max) { return max > 0 ? Math.min(100, Math.round((val / max) * 100)) : 0 }
function fmtNum(n) { return typeof n === 'number' ? n : parseFloat(n) || 0 }
function absPct(planned, actual) {
  if (planned <= 0) return '0,00%'
  return (Math.abs(planned - actual) / planned * 100).toFixed(2).replace('.', ',') + '%'
}

function Donut({ received, expected }) {
  const p = pct(received, expected)
  const r = 35, circ = 2 * Math.PI * r
  const fill = circ * (p / 100)
  const color = p >= 100 ? '#5cb85c' : p >= 80 ? '#f0a500' : '#d9534f'
  return (
    <svg viewBox="0 0 90 90" width="90" height="90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="#e0e0e0" strokeWidth="12" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${fill.toFixed(1)} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 45 45)" />
      <text x="45" y="41" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a2e4a">{p}%</text>
      <text x="45" y="52" textAnchor="middle" fontSize="8" fill="#777">Received</text>
      <text x="45" y="61" textAnchor="middle" fontSize="8" fill="#777">{received}/{expected}</text>
    </svg>
  )
}

function ProgressBar({ value, target }) {
  const w = Math.min(100, Math.round((value / (target || 100)) * 100))
  const c = value >= target ? '#5cb85c' : '#f0a500'
  return (
    <div style={{ position: 'relative', background: '#ddd', height: 12, borderRadius: 2, margin: '4px 0' }}>
      <div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: 2 }} />
      <div style={{ position: 'absolute', top: -3, left: `${Math.min(98, target)}%`, height: 18, width: 2, background: '#333' }} />
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #bbb', borderRadius: 2 }}>
      <div style={{ background: '#1a2e4a', color: '#7ec8e3', fontSize: 11, fontWeight: 700, fontStyle: 'italic', textAlign: 'center', padding: '5px 8px', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ padding: 8 }}>{children}</div>
    </div>
  )
}

function Badge({ children, color }) {
  const colors = { green: '#5cb85c', red: '#d9534f', orange: '#f0a500' }
  return <span style={{ background: colors[color] || colors.green, color: 'white', padding: '2px 8px', fontSize: 11, fontWeight: 700, borderRadius: 2 }}>{children}</span>
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
    const t = setInterval(() => setRefreshIn(s => { if (s <= 1) { fetchData(); return 60 } return s - 1 }), 1000)
    return () => clearInterval(t)
  }, [fetchData])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')

  if (loading) return <div style={{ minHeight: '100vh', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, color: '#1a2e4a', fontWeight: 700 }}>Connexion à Google Sheets…</div></div></div>
  if (error) return <div style={{ minHeight: '100vh', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}><div style={{ background: 'white', borderRadius: 6, padding: 32, textAlign: 'center' }}><div style={{ color: '#d9534f', fontWeight: 700, marginBottom: 12 }}>{error}</div><button onClick={fetchData} style={{ background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}>Réessayer</button></div></div>

  const { po = {expected:0,received:0,remaining:0}, rate = {planned:0,actual:0}, lti = {year:0,days:0,lastDate:''}, abs = {amPlanned:0,amActual:0,pmPlanned:0,pmActual:0}, otif = {val:0,onTime:0,inFull:0}, gmp = {val:0}, errorRate = {val:0}, hotPO = [], pendingUnload = [], unreceived = [] } = data || {}

  return (
    <div style={{ background: '#e8e8e8', minHeight: '100vh', padding: 8, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#1a2e4a', display: 'flex', alignItems: 'center', gap: 16, padding: '6px 12px', marginBottom: 6, borderRadius: 2 }}>
        <div style={{ background: 'white', padding: '4px 8px', borderRadius: 2, fontWeight: 900, fontSize: 12, lineHeight: 1.1 }}>HELLO<span style={{ color: '#5cb85c' }}>FRESH</span></div>
        <div style={{ color: '#7ec8e3', fontSize: 16, fontWeight: 700, fontStyle: 'italic', flex: 1, letterSpacing: 1 }}>DASHBOARD INBOUND</div>
        <div style={{ fontSize: 11, color: '#aaa', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>⟳ {refreshIn}s</span>
          <button onClick={fetchData} style={{ background: 'none', border: '1px solid #aaa', color: '#aaa', borderRadius: 3, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>Actualiser</button>
          <span>{user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 3, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <div style={{ background: 'white', border: '1px solid #bbb', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>Time : <span style={{ color: '#1a2e4a' }}>{hh}:{mm}</span></div>
        <div style={{ background: 'white', border: '1px solid #bbb', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>Sheet ID : <span style={{ color: '#5cb85c' }}>✅ Connectée</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
        <Card title="PO INBOUND">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Donut received={fmtNum(po.received)} expected={fmtNum(po.expected)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: 10, borderTop: '1px solid #eee', paddingTop: 4, width: '100%' }}>
              <div><div style={{ color: '#777' }}>Expected</div><div style={{ fontWeight: 700, color: '#1a2e4a' }}>{po.expected}</div></div>
              <div><div style={{ color: '#777' }}>Received</div><div style={{ fontWeight: 700, color: '#1a2e4a' }}>{po.received}</div></div>
              <div><div style={{ color: '#777' }}>Remaining</div><div style={{ fontWeight: 700, color: po.remaining > 0 ? '#d9534f' : '#5cb85c' }}>{po.remaining}</div></div>
            </div>
          </div>
        </Card>

        <Card title="HOT PO">
          <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #ddd' }}>Supplier</th>
              <th style={{ textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #ddd' }}>PO</th>
              <th style={{ textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #ddd' }}>Status</th>
            </tr></thead>
            <tbody>
              {hotPO.length === 0
                ? <tr><td colSpan={3} style={{ color: '#aaa', fontStyle: 'italic', padding: 4 }}>Pas de PRIO</td></tr>
                : hotPO.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '2px 4px', borderBottom: '1px solid #f0f0f0' }}>{row.supplier}</td>
                    <td style={{ padding: '2px 4px', borderBottom: '1px solid #f0f0f0' }}>{row.po}</td>
                    <td style={{ padding: '2px 4px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ background: row.status === 'OK' ? '#5cb85c' : '#d9534f', color: 'white', padding: '1px 5px', fontSize: 9, borderRadius: 2 }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>

        <Card title="PENDING UNLOAD">
          {pendingUnload.length === 0
            ? <div style={{ color: '#aaa', fontSize: 10, fontStyle: 'italic' }}>Aucun en attente</div>
            : pendingUnload.map((item, i) => <div key={i} style={{ background: '#e0ecf8', marginBottom: 2, padding: '2px 6px', fontSize: 10, color: '#1a2e4a', fontWeight: 600 }}>{item}</div>)
          }
        </Card>

        <Card title="UNRECEIVED PO">
          {unreceived.length === 0
            ? <div style={{ color: '#aaa', fontSize: 10, fontStyle: 'italic' }}>Aucun</div>
            : unreceived.map((item, i) => <div key={i} style={{ background: '#fde8e8', marginBottom: 2, padding: '2px 6px', fontSize: 10, color: '#d9534f', fontWeight: 600 }}>{item}</div>)
          }
        </Card>

        <Card title="INBOUND RATE">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, height: 80 }}>
            {[{ label: 'Planned', val: fmtNum(rate.planned), color: '#7ec8e3' }, { label: 'Actual', val: fmtNum(rate.actual), color: '#1a2e4a' }].map(({ label, val, color }) => {
              const maxVal = Math.max(fmtNum(rate.planned), fmtNum(rate.actual))
              const h = Math.round((val / (maxVal || 1)) * 64)
              return <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 32, height: h, background: color, borderRadius: '2px 2px 0 0' }} />
                <div style={{ fontSize: 11, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 9, color: '#777' }}>{label}</div>
              </div>
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <span style={{ background: fmtNum(rate.actual) >= fmtNum(rate.planned) ? '#5cb85c' : '#d9534f', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2 }}>
              Écart : {fmtNum(rate.actual) - fmtNum(rate.planned) >= 0 ? '+' : ''}{fmtNum(rate.actual) - fmtNum(rate.planned)}
            </span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        <Card title="LTI">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>LTI (This Year) :</span>
            <Badge color={fmtNum(lti.year) === 0 ? 'green' : 'red'}>{lti.year}</Badge>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>DAYS WITHOUT LTI :</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#5cb85c', textAlign: 'center' }}>{lti.days}</div>
          <div style={{ fontSize: 10, color: '#777', marginTop: 6 }}>Last LTI : {lti.lastDate}</div>
        </Card>

        <Card title="ABSENTEEISM">
          {[{ label: 'AM', planned: fmtNum(abs.amPlanned), actual: fmtNum(abs.amActual) }, { label: 'PM', planned: fmtNum(abs.pmPlanned), actual: fmtNum(abs.pmActual) }].map(({ label, planned, actual }) => {
            const p = absPct(planned, actual)
            const pNum = parseFloat(p)
            return <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2e4a', marginBottom: 2 }}>{label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: '#777' }}>Planned</span><span>{planned}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: '#777' }}>Actual</span><span>{actual}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2 }}><span style={{ color: '#777' }}>Abs %</span><Badge color={pNum > 10 ? 'red' : pNum > 5 ? 'orange' : 'green'}>{p}</Badge></div>
            </div>
          })}
        </Card>

        <Card title="OTIF INBOUND">
          <div style={{ fontSize: 10, color: '#777', textAlign: 'center' }}>Current Day</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: fmtNum(otif.val) >= 90 ? '#5cb85c' : '#f0a500', textAlign: 'center', fontStyle: 'italic' }}>{otif.val}%</div>
          {fmtNum(otif.val) < 90 && <div style={{ color: '#d9534f', fontSize: 9, textAlign: 'center' }}>⚠ Below target &lt; 90%</div>}
          <ProgressBar value={fmtNum(otif.val)} target={90} />
          <div style={{ fontSize: 8, color: '#777', display: 'flex', justifyContent: 'space-between' }}><span>0%</span><span>90% Target</span></div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#555' }}>
            <div>On time <strong>{otif.onTime}%</strong></div>
            <div>In full <strong>{otif.inFull}%</strong></div>
          </div>
        </Card>

        <Card title="GMP">
          <div style={{ fontSize: 30, fontWeight: 700, color: fmtNum(gmp.val) >= 95 ? '#5cb85c' : '#f0a500', textAlign: 'center', fontStyle: 'italic' }}>{gmp.val}%</div>
          {fmtNum(gmp.val) < 95 && <div style={{ color: '#d9534f', fontSize: 9, textAlign: 'center' }}>⚠ Below target &lt; 95%</div>}
          <ProgressBar value={fmtNum(gmp.val)} target={95} />
          <div style={{ fontSize: 8, color: '#777', display: 'flex', justifyContent: 'space-between' }}><span>0%</span><span>95% Target</span></div>
        </Card>

        <Card title="ERROR RATE INB">
          <div style={{ fontSize: 10, color: '#777', textAlign: 'center' }}>Semaine en cours</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontStyle: 'italic', textAlign: 'center', color: fmtNum(String(errorRate.val).replace(',', '.')) < 1 ? '#5cb85c' : '#d9534f' }}>{errorRate.val}%</div>
          <div style={{ fontSize: 9, color: '#5cb85c', textAlign: 'center' }}>{fmtNum(String(errorRate.val).replace(',', '.')) < 1 ? '✅ Target reached < 1%' : '⚠ Above target'}</div>
        </Card>
      </div>
    </div>
  )
}