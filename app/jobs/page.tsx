'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function JobsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [applying, setApplying] = useState<string|null>(null)
  const [applyModal, setApplyModal] = useState<any>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const [toast, setToast] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: saved } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id)
      setSavedIds((saved||[]).map((s:any) => s.job_id))
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveJob(job: any) {
    if (!user) return
    if (savedIds.includes(job.id)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', job.id)
      setSavedIds(prev => prev.filter(id => id !== job.id))
      showToast('Removed from saved')
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: job.id, job_data: job })
      setSavedIds(prev => [...prev, job.id])
      showToast('Job saved! 🔖')
    }
  }

  function openApply(job: any) {
    const skills = profile?.skills || []
    const letter = `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} position at ${job.company}. With hands-on experience in ${skills.slice(0,4).join(', ')}, I am confident I can contribute meaningfully to your team.\n\nI have built production-grade applications with a focus on performance and clean architecture. I am excited about the opportunity to bring this expertise to ${job.company}.\n\nThank you for your time and consideration.\n\nBest regards,\n${profile?.full_name || user?.email}`
    setCoverLetter(letter)
    setHrEmail('')
    setApplyModal(job)
  }

  async function sendApplication() {
    if (!hrEmail) { showToast('Please enter HR email'); return }
    setApplying(applyModal.id)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: applyModal.id,
          jobTitle: applyModal.title,
          company: applyModal.company,
          jobUrl: applyModal.url,
          hrEmail,
          coverLetter,
          userEmail: user.email,
          userName: profile?.full_name || user.email,
          resumeUrl: profile?.resume_url || '',
          matchScore: applyModal.matchScore || 0,
        })
      })
      if (res.ok) {
        showToast('Applied successfully! ✅ CC sent to your email')
        setApplyModal(null)
      } else { showToast('Failed to send. Try again.') }
    } catch { showToast('Error sending application') }
    setApplying(null)
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || j.tags?.some((t:string) => t.toLowerCase().includes(q))
    const matchSource = source === 'all' || j.source?.toLowerCase().includes(source.toLowerCase())
    return matchSearch && matchSource
  })

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, color: text }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px' }}>
        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a7a4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: text }}>Find jobs</h1>
            <p style={{ fontSize: 13, color: muted, marginTop: 2 }}>{jobs.length} jobs matched to your skills</p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16 }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search jobs, companies, skills..."
            style={{ flex: 1, minWidth: 220, padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, background: cardBg, color: text, outline: 'none' }} />
          {['all','remotive','arbeitnow','web3'].map(s => (
            <button key={s} onClick={() => setSource(s)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${source===s?'#1a7a4a':border}`, background: source===s?'#e8f5ee':cardBg, color: source===s?'#1a7a4a':muted, fontSize: 13, cursor: 'pointer', fontWeight: source===s?600:400, textTransform:'capitalize' }}>
              {s === 'all' ? '🌍 All' : s === 'remotive' ? '🌐 Remotive' : s === 'arbeitnow' ? '🇪🇺 EU Jobs' : '⛓️ Web3'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ color: muted }}>Finding best-matched jobs...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filtered.map(job => (
              <div key={job.id} style={{ background: cardBg, border: `1px solid ${job.matchScore>=80?'#1a7a4a':border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, background: '#e8f5ee', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {job.source==='Web3.career'?'⛓️':job.source==='Arbeitnow'?'🇪🇺':'🌐'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 2 }}>{job.title}</h3>
                      <p style={{ fontSize: 13, color: muted }}>{job.company} · {job.location}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {job.matchScore > 0 && (
                        <span style={{ background: job.matchScore>=80?'#e8f5ee':'#f3f4f6', color: job.matchScore>=80?'#1a7a4a':'#666', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                          {job.matchScore}% match
                        </span>
                      )}
                      {job.salary && <span style={{ fontSize: 12, color: muted }}>💰 {job.salary}</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: muted, margin: '8px 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {job.description}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(job.tags||[]).slice(0,5).map((t:string) => (
                      <span key={t} style={{ fontSize: 11, background: '#e8f5ee', color: '#1a7a4a', padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openApply(job)} style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      ⚡ One-click apply
                    </button>
                    <button onClick={() => saveJob(job)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 7, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: savedIds.includes(job.id)?'#f59e0b':muted }}>
                      {savedIds.includes(job.id) ? '🔖 Saved' : '🔖 Save'}
                    </button>
                    <a href={job.url} target="_blank" rel="noreferrer" style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 7, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: muted, textDecoration: 'none', display:'inline-flex',alignItems:'center' }}>
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <p style={{ color: muted }}>No jobs found. Try a different search.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {applyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: text, marginBottom: 4 }}>Apply to {applyModal.company}</h3>
            <p style={{ fontSize: 13, color: muted, marginBottom: 20 }}>{applyModal.title}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>HR Email *</label>
              <input value={hrEmail} onChange={e => setHrEmail(e.target.value)} placeholder="hr@company.com"
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, background: darkMode?'#0f172a':cardBg, color: text, outline:'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>Cover letter (AI generated — edit freely)</label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={10}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 13, background: darkMode?'#0f172a':cardBg, color: text, outline:'none', resize:'vertical', lineHeight: 1.6 }} />
            </div>
            <div style={{ background: '#e8f5ee', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1a7a4a', marginBottom: 20 }}>
              📧 Your resume will be linked + a CC copy goes to your email
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setApplyModal(null)} style={{ padding: '9px 18px', border: `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', background: 'none', color: text, fontSize: 14 }}>Cancel</button>
              <button onClick={sendApplication} disabled={!!applying} style={{ padding: '9px 20px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, cursor: applying?'not-allowed':'pointer', fontSize: 14, fontWeight: 600, opacity: applying?0.7:1 }}>
                {applying ? 'Sending...' : '⚡ Send application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
