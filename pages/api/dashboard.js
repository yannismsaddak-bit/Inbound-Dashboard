import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { google } from 'googleapis'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Non autorisé' })

  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const sheets = google.sheets({ version: 'v4', auth })
    const SHEET_ID = process.env.SHEET_ID

    const get = async (range) => {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
      })
      return r.data.values || []
    }

    const [poExp, poRec, poRem, ratePlanned, rateActual, lti, otif, gmp, err] = await Promise.all([
      get('Dashboard V2!B26'),
      get('Dashboard V2!C26'),
      get('Dashboard V2!D26'),
      get('Data2!H1'),
      get('Data2!C15'),
      get('Dashboard V2!B39'),
      get('Dashboard V2!K34'),
      get('Dashboard V2!N32'),
      get('Dashboard V2!R35'),
    ])

    const v = (arr) => arr?.[0]?.[0] ?? 0

    res.status(200).json({
      po: { 
        expected: v(poExp), 
        received: v(poRec), 
        remaining: v(poRem) 
      },
      rate: { 
        planned: v(ratePlanned), 
        actual: v(rateActual) 
      },
      lti: { 
        year: 0, 
        days: v(lti), 
        lastDate: '06/12/2025' 
      },
      abs: { 
        amPlanned: 21, 
        amActual: 17, 
        pmPlanned: 0, 
        pmActual: 9 
      },
      otif: { 
        val: Math.round(v(otif) * 100), 
        onTime: 88, 
        inFull: 67 
      },
      gmp: { val: Math.round(v(gmp) * 100) },
      errorRate: { val: v(err) },
      hotPO: [],
      pendingUnload: [],
      unreceived: [],
      lastUpdated: new Date().toISOString(),
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: 'Erreur lecture sheet: ' + e.message })
  }
}