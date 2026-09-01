'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({ full_name:'', job_title:'', location:'', linkedin_url:'', portfolio_url:'' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setForm({ full_name: prof?.full_name||'', job_title: prof?.job_title||'', location: prof?.location||'', linkedin_url: prof?.linkedin_url||'', portfolio_url: prof?.portfolio_url||'' })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', user.id)
    setProfile((p:any) => ({ ...p, ...form }))
    setToast('Profile saved! ✅')
    setTimeout(() => setToast(''), 3000)
    setSaving(false)
  }

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: bg }}><p style={{ color: muted }}>Loading...</p></div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: bg }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex:1, padding:'28px 32px', maxWidth: 700 }}>
        {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1a7a4a', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:500, zIndex:200 }}>{toast}</div>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color: text }}>Profile</h1>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:16 }}>{darkMode ? '☀️' : '🌙'}</button>
        </div>

        {/* Avatar */}
        <div style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:16, padding:28, marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:'#1a7a4a', flexShrink:0 }}>
            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight:600, fontSize:17, color: text }}>{profile?.full_name || 'Your name'}</p>
            <p style={{ color: muted, fontSize:13 }}>{user?.email}</p>
            <span style={{ fontSize:11, background:'#e8f5ee', color:'#1a7a4a', padding:'2px 10px', borderRadius:10, fontWeight:500 }}>
              {profile?.role === 'admin' ? '👑 Admin' : '👤 Member'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:16, padding:28 }}>
          <form onSubmit={handleSave}>
            {[
              { key:'full_name', label:'Full name', placeholder:'Rahul Patle', type:'text' },
              { key:'job_title', label:'Job title / target role', placeholder:'Full Stack Developer', type:'text' },
              { key:'location', label:'Location', placeholder:'Indore, MP', type:'text' },
              { key:'linkedin_url', label:'LinkedIn URL', placeholder:'https://linkedin.com/in/...', type:'url' },
              { key:'portfolio_url', label:'Portfolio / Website', placeholder:'https://rahulpatle.xyz', type:'url' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color: text, marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${border}`, borderRadius:8, fontSize:14, background: darkMode?'#0f172a':cardBg, color: text, outline:'none' }} />
              </div>
            ))}
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', background:'#1a7a4a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', opacity: saving?0.7:1 }}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
