'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ users:0, apps:0, resumes:0, todayApps:0 })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setUser(user)
      setProfile(prof)

      const { count: userCount } = await supabase.from('profiles').select('*', { count:'exact', head:true })
      const { count: appCount } = await supabase.from('applications').select('*', { count:'exact', head:true })
      const { count: resumeCount } = await supabase.from('profiles').select('*', { count:'exact', head:true }).not('resume_url','is',null)
      const today = new Date(); today.setHours(0,0,0,0)
      const { count: todayCount } = await supabase.from('applications').select('*', { count:'exact', head:true }).gte('created_at', today.toISOString())

      setStats({ users: userCount||0, apps: appCount||0, resumes: resumeCount||0, todayApps: todayCount||0 })

      const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20)
      setUsers(allUsers || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><p>Loading admin...</p></div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f9fafb' }}>
      <Sidebar userName={profile?.full_name || 'Admin'} />
      <main style={{ flex:1, padding:'28px 32px' }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:28 }}>👑 Admin panel</h1>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:32 }}>
          {[
            { label:'Total users', value: stats.users, icon:'👥' },
            { label:'Total applications', value: stats.apps, icon:'📤' },
            { label:'Resumes uploaded', value: stats.resumes, icon:'📄' },
            { label:"Today's applies", value: stats.todayApps, icon:'📅' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:700, color:'#1a1a1a' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e7eb' }}>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1a1a' }}>Recent users</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  {['Name','Email','Role','Resume','Skills','Joined'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:12, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop:'1px solid #f3f4f6' }}>
                    <td style={{ padding:'14px 20px', fontSize:14, fontWeight:500, color:'#1a1a1a' }}>{u.full_name || '—'}</td>
                    <td style={{ padding:'14px 20px', fontSize:13, color:'#666' }}>{u.email}</td>
                    <td style={{ padding:'14px 20px' }}>
                      <span style={{ fontSize:11, background: u.role==='admin'?'#fef9ee':'#e8f5ee', color: u.role==='admin'?'#92400e':'#1a7a4a', padding:'2px 10px', borderRadius:10, fontWeight:500 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:13 }}>{u.resume_url ? '✅' : '—'}</td>
                    <td style={{ padding:'14px 20px', fontSize:13, color:'#666' }}>{(u.skills||[]).length}</td>
                    <td style={{ padding:'14px 20px', fontSize:13, color:'#888' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
