'use client'
import { useEffect, useState, useRef, useMemo ,useCallback} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import gsap from 'gsap'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

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

  const byStatus = useCallback((s: string) => apps.filter(a => a.status === s), [apps])
  const appliedThisWeek = apps.filter(a => {
    const d = new Date(a.created_at)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7 && a.status !== 'saved'
  }).length

  const weeklyData = useMemo(() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    const now = new Date()
    const dayOfWeek = now.getDay()
    const result = days.map((day, i) => {
      const targetDay = (dayOfWeek + 6 - i) % 7
      const date = new Date(now)
      date.setDate(now.getDate() - targetDay)
      date.setHours(0,0,0,0)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      const count = apps.filter(a => {
        const created = new Date(a.created_at)
        return created >= date && created < nextDate && a.status !== 'saved'
      }).length
      return { day, count }
    }).reverse()
    return result
  }, [apps])

  const statusData = useMemo(() => {
    const statuses = ['applied','interview','offer','rejected']
    return statuses.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: byStatus(s).length,
      color: STATUS_COLOR[s]
    })).filter(d => d.value > 0)
  }, [byStatus])

  const companyData = useMemo(() => {
    const counts: Record<string, number> = {}
    apps.filter(a => a.status !== 'saved').forEach(a => {
      counts[a.company] = (counts[a.company] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5)
      .map(([name, value]) => ({ name, value }))
  }, [apps])

  const responseRate = useMemo(() => {
    const total = apps.filter(a => a.status !== 'saved').length
    const responses = byStatus('interview').length + byStatus('offer').length
    return total > 0 ? Math.round((responses / total) * 100) : 0
  }, [apps, byStatus])

  const skillsData = useMemo(() => {
    const counts: Record<string, number> = {}
    apps.filter(a => a.status !== 'saved' && a.tags).forEach(a => {
      a.tags.forEach((tag: string) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0,15)
      .map(([name, value]) => ({ name, value }))
  }, [apps])

  const bestDayData = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const responseDays = apps.filter(a => a.status === 'interview' || a.status === 'offer')
    const counts = days.map(day => ({
      day,
      count: responseDays.filter(a => new Date(a.created_at).getDay() === days.indexOf(day)).length
    }))
    const maxDay = counts.reduce((max, d) => d.count > max.count ? d : max, counts[0])
    return { counts, bestDay: maxDay }
  }, [apps])

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

        {/* Analytics */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 16, marginTop: 32 }}>📈 Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16, marginBottom: 16 }}>
          {/* Weekly Apply Chart */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Weekly Applications</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a7a4a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1a7a4a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="day" stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={muted} fontSize={11} tickLine={false} axisLine={false} tickCount={4} />
                <Tooltip
                  contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8 }}
                  labelStyle={{ color: text }}
                  formatter={(value: number) => [value, 'applications']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1a7a4a"
                  strokeWidth={2.5}
                  dot={{ r: 5, strokeWidth: 2, fill: '#1a7a4a' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="transparent"
                  strokeWidth={0}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  labelOffset={25}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8 }}
                  formatter={(value: number) => [value, 'applications']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: text }}>
                  {apps.filter(a => a.status !== 'saved').length}
                </div>
                <div style={{ fontSize: 11, color: muted }}>Total applied</div>
              </div>
            </div>
          </div>

          {/* Top Companies */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Top Companies Applied</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={companyData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} horizontal={false} />
                <XAxis type="number" stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  stroke={muted}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: text }}
                />
                <Tooltip
                  contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8 }}
                  formatter={(value: number) => [value, 'applications']}
                />
                <Bar dataKey="value" fill="#1a7a4a" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Rate */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Response Rate</h3>
            <div style={{ fontSize: 56, fontWeight: 700, color: '#1a7a4a', marginBottom: 8 }}>{responseRate}%</div>
            <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>
              {(byStatus('interview').length + byStatus('offer').length)} of {apps.filter(a => a.status !== 'saved').length} applications
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>📈</span>
              <span style={{ fontSize: 13, color: muted }}>Trending</span>
            </div>
          </div>

          {/* Skills in Demand */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Skills in Demand</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skillsData.length > 0 ? skillsData.map((skill) => (
                <span
                  key={skill.name}
                  style={{
                    background: darkMode ? '#1e293b' : '#f3f4f6',
                    color: text,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: Math.max(11, 11 + (skill.value / (skillsData[0]?.value || 1)) * 8),
                    fontWeight: 500,
                    border: `1px solid ${border}`,
                    opacity: 0.7 + (skill.value / (skillsData[0]?.value || 1)) * 0.3
                  }}
                >
                  {skill.name}
                </span>
              )) : (
                <span style={{ color: muted, fontSize: 13 }}>No skill data yet</span>
              )}
            </div>
          </div>

          {/* Best Day to Apply */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 16 }}>Best Day to Apply</h3>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {bestDayData.counts.map(d => (
                <div
                  key={d.day}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: d.day === bestDayData.bestDay.day
                      ? '#1a7a4a'
                      : darkMode ? '#334155' : '#f3f4f6',
                    color: d.day === bestDayData.bestDay.day ? '#fff' : text,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: d.count > 0 ? 1 : 0.4,
                    border: d.day === bestDayData.bestDay.day ? '2px solid #1a7a4a' : 'none'
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{d.day.slice(0,3)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{d.count}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: text, fontWeight: 500 }}>
                {bestDayData.bestDay.count > 0
                  ? `${bestDayData.bestDay.day} is your lucky day! 🍀`
                  : 'Apply more to find your lucky day!'}
              </p>
              <p style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                {bestDayData.bestDay.count} responses on {bestDayData.bestDay.day}
              </p>
            </div>
          </div>
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
