// v4
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Non autorise' })

  const SHEET_ID = process.env.SHEET_ID
  const KEY = process.env.GOOGLE_API_KEY

  const get = async (range) => {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + SHEET_ID + '/values/' + encodeURIComponent(range) + '?key=' + KEY
    const r = await fetch(url)
    const data = await r.json()
    if (data.error) throw new Error(data.error.message)
    return data.values || []
  }

  try {
    const [
      poExp, poRec, poRem,
      ratePlanned, rateActual,
      ltiYear, ltiDays, ltiDate,
      amPlanned, amActual, amAbs,
      pmPlanned, pmActual, pmAbs,
      otifVal, otifOT, otifIF,
      gmpVal, gmpPrev,
      errVal, errPrev, errTrend,
      hotPO,
      pendingUnload,
      unreceived,
    ] = await Promise.all([
      get('Dashboard V2!B26'),
      get('Dashboard V2!C26'),
      get('Dashboard V2!D26'),
      get('Data2!H1'),
      get('Data2!C15'),
      get('Dashboard V2!D33'),
      get('Dashboard V2!B39'),
      get('Dashboard V2!C45'),
      get('Dashboard V2!I31'),
      get('Dashboard V2!I33'),
      get('Dashboard V2!I35'),
      get('Dashboard V2!I39'),
      get('Dashboard V2!I42'),
      get('Dashboard V2!I44'),
      get('Dashboard V2!K34'),
      get('Dashboard V2!K42'),
      get('Dashboard V2!K45'),
      get('Dashboard V2!N32'),
      get('Dashboard V2!O45'),
      get('Dashboard V2!R35'),
      get('Dashboard V2!S42'),
      get('Dashboard V2!T42'),
      get('Dashboard V2!G12:I27'),
      get('Dashboard V2!K12:L27'),
      get('Dashboard V2!N12:P27'),
    ])

    const v = (arr) => arr && arr[0] && arr[0][0] !== undefined ? arr[0][0] : 0
    const vStr = (arr) => arr && arr[0] && arr[0][0] !== undefined ? String(arr[0][0]) : ''

    // Error rate: valeur brute de la sheet (ex: 0.0008) → on multiplie par 100 → 0.08%
    const errRaw = parseFloat(v(errVal)) || 0
    const errPct = parseFloat((errRaw * 100).toFixed(2))
    const errPrevRaw = parseFloat(v(errPrev)) || 0
    const errPrevPct = parseFloat((errPrevRaw * 100).toFixed(2))

    // OTIF: valeur brute (ex: 0.64) → 64%
    const otifRaw = parseFloat(v(otifVal)) || 0
    const otifPct = Math.round(otifRaw * 100)
    const otifOTRaw = parseFloat(v(otifOT)) || 0
    const otifOTPct = Math.round(otifOTRaw * 100)
    const otifIFRaw = parseFloat(v(otifIF)) || 0
    const otifIFPct = Math.round(otifIFRaw * 100)

    // GMP: valeur brute (ex: 0.82) → 82%
    const gmpRaw = parseFloat(v(gmpVal)) || 0
    const gmpPct = Math.round(gmpRaw * 100)
    const gmpPrevRaw = parseFloat(v(gmpPrev)) || 0
    const gmpPrevPct = Math.round(gmpPrevRaw * 100)

    // Hot PO: tableau G12:I27
    const hotPOData = (hotPO || [])
      .filter(row => row[0] && String(row[0]).trim() !== '')
      .map(row => ({ supplier: row[0] || '', po: row[1] || '', status: row[2] || '' }))

    // Pending Unload: tableau K12:L27
    const pendingData = (pendingUnload || [])
      .filter(row => row[0] && String(row[0]).trim() !== '')
      .map(row => ({ quai: row[0] || '', supplier: row[1] || '' }))

    // Unreceived PO: tableau N12:P27
    const unreceivedData = (unreceived || [])
      .filter(row => row[0] && String(row[0]).trim() !== '')
      .map(row => ({ supplier: row[0] || '', po: row[1] || '', status: row[2] || '' }))

    res.status(200).json({
      po: {
        expected: v(poExp),
        received: v(poRec),
        remaining: v(poRem),
      },
      rate: {
        planned: v(ratePlanned),
        actual: v(rateActual),
      },
      lti: {
        year: v(ltiYear),
        days: v(ltiDays),
        lastDate: vStr(ltiDate) || '06/12/2025',
      },
      abs: {
        amPlanned: v(amPlanned),
        amActual: v(amActual),
        amAbs: vStr(amAbs),
        pmPlanned: v(pmPlanned),
        pmActual: v(pmActual),
        pmAbs: vStr(pmAbs),
      },
      otif: {
        val: otifPct,
        onTime: otifOTPct,
        inFull: otifIFPct,
      },
      gmp: {
        val: gmpPct,
        prev: gmpPrevPct,
      },
      errorRate: {
        val: errPct,
        prev: errPrevPct,
        trend: vStr(errTrend),
      },
      hotPO: hotPOData,
      pendingUnload: pendingData,
      unreceived: unreceivedData,
      lastUpdated: new Date().toISOString(),
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}