// v2
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Non autorise' })

  const SHEET_ID = process.env.SHEET_ID
  const KEY = process.env.GOOGLE_API_KEY
  console.log('KEY:', KEY ? 'définie' : 'UNDEFINED')

  const get = async (range) => {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + SHEET_ID + '/values/' + encodeURIComponent(range) + '?key=' + KEY
    const r = await fetch(url)
    const data = await r.json()
    if (data.error) throw new Error(data.error.message)
    return data.values || []
  }

  try {
    const results = await Promise.all([
      get('Dashboard V2!B26'), get('Dashboard V2!C26'), get('Dashboard V2!D26'),
      get('Data2!H1'), get('Data2!C15'), get('Dashboard V2!B39'),
      get('Dashboard V2!K34'), get('Dashboard V2!N32'), get('Dashboard V2!R35'),
    ])
    const v = (arr) => arr && arr[0] && arr[0][0] !== undefined ? arr[0][0] : 0
    res.status(200).json({
      po: { expected: v(results[0]), received: v(results[1]), remaining: v(results[2]) },
      rate: { planned: v(results[3]), actual: v(results[4]) },
      lti: { year: 0, days: v(results[5]), lastDate: '06/12/2025' },
      abs: { amPlanned: 21, amActual: 17, pmPlanned: 0, pmActual: 9 },
      otif: { val: Math.round(v(results[6]) * 100), onTime: 88, inFull: 67 },
      gmp: { val: Math.round(v(results[7]) * 100) },
      errorRate: { val: v(results[8]) },
      hotPO: [], pendingUnload: [], unreceived: [],
      lastUpdated: new Date().toISOString(),
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}