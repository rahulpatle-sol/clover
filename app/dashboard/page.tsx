'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import gsap from 'gsap'
import Link from 'next/link'

const STATUSES = ['saved','applied','interview','offer','rejected']
const STATUS_COLOR: Record<string,string> = {
  saved:'#6366f1', applied:'#1a7a4a', interview:'#f59e0b', offer:'#10b981', rejected:'#ef4444'
}
const STATUS_BG: Record<string,string> = {
  saved:'#eef2ff', applied:'#e8f5ee', interview:'#fef9ee', offer:'#ecfdf5', rejected:'#fef2f2'
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(10)
  const [darkMode, setDarkMode] = useState(false)
  const [note, setNote] = useState<{id:string,val:string}|null>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: applications } = await supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setApps(applications || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading && statsRef.current) {
      gsap.from('.stat-card', { opacity: 0, y: 24, duration: 0.5, stagger: 0.1, ease: 'power2.out' })
      gsap.from('.kanban-col', { opacity: 0, y: 20, duration: 0.5, stagger: 0.08, delay: 0.3 })
    }
  }, [loading])

  async function moveApp(id: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function deleteApp(id: string) {
    await supabase.from('applications').delete().eq('id', id)
    setApps(prev => prev.filter(a => a.id !== id))
  }

  async function saveNote(id: string, val: string) {
    await supabase.from('applications').update({ notes: val }).eq('id', id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes: val } : a))
    setNote(null)
  }

  const byStatus = (s: string) => apps.filter(a => a.status === s)
  const appliedThisWeek = apps.filter(a => {
    const d = new Date(a.created_at)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7 && a.status !== 'saved'
  }).length

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🍀</div>
        <p style={{ color: muted }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, color: text }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: text, marginBottom: 4 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ color: muted, fontSize: 14 }}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16, color: text }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <Link href="/jobs" style={{ background: '#1a7a4a', color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
              + Find jobs
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total applied', value: apps.filter(a=>a.status!=='saved').length, icon: '📤' },
            { label: 'Interviews', value: byStatus('interview').length, icon: '🎯' },
            { label: 'Offers', value: byStatus('offer').length, icon: '🏆' },
            { label: 'This week', value: appliedThisWeek, icon: '📅' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: text, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly Goal */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: text }}>🎯 Weekly goal — {appliedThisWeek}/{goal} applications</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setGoal(g => Math.max(1,g-1))} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: text }}>-</button>
              <button onClick={() => setGoal(g => g+1)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: text }}>+</button>
            </div>
          </div>
          <div style={{ background: darkMode ? '#334155' : '#f3f4f6', borderRadius: 100, height: 8, overflow: 'hidden' }}>
            <div style={{ background: '#1a7a4a', height: '100%', width: `${Math.min(100, (appliedThisWeek/goal)*100)}%`, borderRadius: 100, transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: muted, marginTop: 6 }}>
            {appliedThisWeek >= goal ? '🎉 Goal reached this week!' : `${goal - appliedThisWeek} more to hit your goal`}
          </p>
        </div>

        {/* Kanban */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 16 }}>Application tracker</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, overflowX: 'auto' }}>
          {STATUSES.map(status => (
            <div key={status} className="kanban-col" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 14, minHeight: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[status], textTransform: 'capitalize' }}>{status}</span>
                <span style={{ fontSize: 11, background: STATUS_BG[status], color: STATUS_COLOR[status], padding: '2px 8px', borderRadius: 10 }}>{byStatus(status).length}</span>
              </div>
              {byStatus(status).map(app => (
                <div key={app.id} style={{ background: darkMode ? '#0f172a' : '#f9fafb', border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: muted, marginBottom: 3 }}>{app.company}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: text, marginBottom: 8 }}>{app.job_title}</div>
                  {app.match_score > 0 && (
                    <div style={{ fontSize: 10, background: '#e8f5ee', color: '#1a7a4a', padding: '2px 7px', borderRadius: 10, display:'inline-block', marginBottom: 8 }}>{app.match_score}% match</div>
                  )}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {STATUSES.filter(s=>s!==status).slice(0,2).map(s => (
                      <button key={s} onClick={() => moveApp(app.id, s)} style={{ fontSize: 10, background: 'none', border: `1px solid ${border}`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', color: muted }}>→ {s}</button>
                    ))}
                    <button onClick={() => setNote({id:app.id,val:app.notes||''})} style={{ fontSize: 10, background: 'none', border: `1px solid ${border}`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', color: muted }}>📝</button>
                    <button onClick={() => deleteApp(app.id)} style={{ fontSize: 10, background: 'none', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                  </div>
                </div>
              ))}
              {byStatus(status).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: muted, fontSize: 12 }}>Empty</div>
              )}
            </div>
          ))}
        </div>

        {/* Note Modal */}
        {note && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 28, width: 420 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 14 }}>📝 Application notes</h3>
              <textarea value={note.val} onChange={e => setNote({...note, val: e.target.value})}
                rows={5} placeholder="Add notes about this application..."
                style={{ width: '100%', border: `1px solid ${border}`, borderRadius: 8, padding: 12, fontSize: 14, resize: 'none', background: darkMode ? '#0f172a' : '#f9fafb', color: text }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                <button onClick={() => setNote(null)} style={{ padding: '8px 16px', border: `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', background: 'none', color: text }}>Cancel</button>
                <button onClick={() => saveNote(note.id, note.val)} style={{ padding: '8px 18px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
