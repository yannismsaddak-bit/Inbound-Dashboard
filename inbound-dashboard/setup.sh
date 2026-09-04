#!/bin/bash

# Pages
mkdir -p pages/api/auth components lib

cat > pages/_app.js << 'ENDOFFILE'
import { SessionProvider } from 'next-auth/react'
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
ENDOFFILE

cat > pages/index.js << 'ENDOFFILE'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Dashboard from '../components/Dashboard'
export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  if (status === 'loading') return <div style={{minHeight:'100vh',background:'#1a2e4a',display:'flex',alignItems:'center',justifyContent:'center',color:'#7ec8e3',fontFamily:'Arial'}}>Chargement…</div>
  if (!session) return null
  return <Dashboard user={session.user} />
}
ENDOFFILE

cat > .env.local << 'ENDOFFILE'
GOOGLE_CLIENT_ID=ton_client_id_ici
GOOGLE_CLIENT_SECRET=ton_client_secret_ici
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=MonDashboardHelloFresh2026Secret!
SHEET_ID=1yAtqq4UAlrbGqBXUSJOT_Hg2Hmjy0xpN1n9o4MWxP3w
ALLOWED_EMAILS=yannis.msaddak@hellofresh.com
ENDOFFILE

echo "✅ Fichiers créés !"