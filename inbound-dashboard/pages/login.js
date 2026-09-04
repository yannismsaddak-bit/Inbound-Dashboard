import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Login() {
  const { data: session } = useSession()
  const router = useRouter()
  const { error } = router.query

  useEffect(() => {
    if (session) router.push('/')
  }, [session, router])

  return (
    <div style={{minHeight:'100vh',background:'#1a2e4a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial'}}>
      <div style={{background:'white',borderRadius:8,padding:'40px 48px',textAlign:'center',maxWidth:380,width:'100%'}}>
        <div style={{display:'inline-block',background:'#1a2e4a',padding:'8px 14px',borderRadius:4,marginBottom:28}}>
          <div style={{color:'white',fontWeight:900,fontSize:14,lineHeight:1.1}}>HELLO<span style={{color:'#5cb85c'}}>FRESH</span></div>
        </div>
        <div style={{fontSize:13,color:'#7ec8e3',fontStyle:'italic',fontWeight:700,letterSpacing:1,marginBottom:8}}>DASHBOARD INBOUND</div>
        <div style={{fontSize:12,color:'#999',marginBottom:32}}>Accès réservé à l'équipe</div>
        {error === 'AccessDenied' && (
          <div style={{background:'#fde8e8',border:'1px solid #f5c6cb',borderRadius:4,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#d9534f'}}>
            Accès refusé — votre email n'est pas autorisé.
          </div>
        )}
        <button onClick={() => signIn('google', { callbackUrl: '/' })} style={{width:'100%',padding:'12px 20px',background:'#1a2e4a',color:'white',border:'none',borderRadius:5,fontSize:14,fontWeight:700,cursor:'pointer'}}>
          Se connecter avec Google
        </button>
      </div>
    </div>
  )
}