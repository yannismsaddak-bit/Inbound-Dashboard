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
