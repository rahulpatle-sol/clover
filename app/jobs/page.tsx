'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Search, Bookmark, BookmarkCheck, ExternalLink, Zap, MapPin, Clock, DollarSign, TrendingUp, Filter, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SalaryInsights from '@/components/SalaryInsights'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function isHot(dateStr: string) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const gradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
]
function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

const ROLES = ['All', 'Full Stack', 'Frontend', 'Backend', 'Web3', 'DevOps', 'Mobile']
const SOURCES = ['all', 'remotive', 'arbeitnow', 'web3']
const SORT_OPTIONS = ['best', 'latest', 'salary']
const JOBS_PER_PAGE = 10

export default function JobsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('best')
  const [page, setPage] = useState(1)
  const [applying, setApplying] = useState<string | null>(null)
  const [applyModal, setApplyModal] = useState<any>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const [toast, setToast] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [findingEmail, setFindingEmail] = useState(false)
  const [emailResults, setEmailResults] = useState<any[]>([])
  const [showEmailDropdown, setShowEmailDropdown] = useState(false)
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
      setSavedIds((saved || []).map((s: any) => s.job_id))
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { setPage(1) }, [search, source, roleFilter, sortBy])

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
    const letter = `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} position at ${job.company}. With hands-on experience in ${skills.slice(0, 4).join(', ')}, I am confident I can contribute meaningfully to your team.\n\nI have built production-grade applications with a focus on performance and clean architecture. I am excited about the opportunity to bring this expertise to ${job.company}.\n\nThank you for your time and consideration.\n\nBest regards,\n${profile?.full_name || user?.email}`
    setCoverLetter(letter)
    setHrEmail('')
    setEmailResults([])
    setShowEmailDropdown(false)
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

  async function findHrEmail() {
    if (!applyModal?.company) return
    setFindingEmail(true)
    setEmailResults([])
    setShowEmailDropdown(false)
    try {
      const res = await fetch(`/api/find-email?company=${encodeURIComponent(applyModal.company)}`)
      const data = await res.json()
      if (res.ok && data.emails?.length > 0) {
        setEmailResults(data.emails)
        setShowEmailDropdown(true)
        showToast(`Found ${data.emails.length} email(s) for ${data.domain}`)
      } else {
        showToast(data.error || 'No emails found for this company')
      }
    } catch {
      showToast('Error finding email')
    }
    setFindingEmail(false)
  }

  function selectEmail(email: string) {
    setHrEmail(email)
    setShowEmailDropdown(false)
    showToast('Email filled ✓')
  }

  const filtered = useMemo(() => {
    let result = jobs.filter(j => {
      const q = search.toLowerCase()
      const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || j.tags?.some((t: string) => t.toLowerCase().includes(q))
      const matchSource = source === 'all' || j.source?.toLowerCase().includes(source.toLowerCase())
      const matchRole = roleFilter === 'all' || j.tags?.some((t: string) => t === roleFilter)
      return matchSearch && matchSource && matchRole
    })
    if (sortBy === 'best') {
      result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    } else if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime())
    } else if (sortBy === 'salary') {
      result.sort((a, b) => {
        const parseSalary = (s: string) => {
          const nums = s.match(/\d+/g)
          return nums ? Math.max(...nums.map(Number)) : 0
        }
        return parseSalary(b.salary || '') - parseSalary(a.salary || '')
      })
    }
    return result
  }, [jobs, search, source, roleFilter, sortBy])

  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE)
  const currentJobs = filtered.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE)

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, color: text }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px' }}>
        <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.shimmer{background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}`}</style>

        {/* Toast */}
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a7a4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {toast}
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: text }}>Find jobs</h1>
          <motion.p style={{ fontSize: 14, color: muted, marginTop: 4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <motion.span key={filtered.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{filtered.length}</motion.span> jobs matched to your skills
          </motion.p>
        </motion.div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, companies, skills..."
              style={{ width: '100%', padding: '10px 14px 10px 38px', border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, background: cardBg, color: text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Role filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${roleFilter === r ? '#1a7a4a' : border}`, background: roleFilter === r ? '#1a7a4a' : 'transparent', color: roleFilter === r ? '#fff' : muted, fontSize: 12, cursor: 'pointer', fontWeight: roleFilter === r ? 600 : 400, transition: 'all 0.15s' }}>
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
            <button onClick={() => setSortOpen(!sortOpen)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, background: cardBg, color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
              <TrendingUp size={14} />{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}{' '}
              <ChevronDown size={14} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {sortOpen && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: 4, zIndex: 50, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                {SORT_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setSortBy(s); setSortOpen(false) }} style={{ display: 'block', width: '100%', padding: '8px 14px', borderRadius: 7, border: 'none', background: sortBy === s ? '#e8f5ee' : 'transparent', color: sortBy === s ? '#1a7a4a' : text, cursor: 'pointer', fontSize: 13, fontWeight: sortBy === s ? 600 : 400, textTransform: 'capitalize', textAlign: 'left' }}>
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Source filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {SOURCES.map(s => (
            <button key={s} onClick={() => setSource(s)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${source === s ? '#1a7a4a' : border}`, background: source === s ? '#1a7a4a' : cardBg, color: source === s ? '#fff' : muted, fontSize: 12, cursor: 'pointer', fontWeight: source === s ? 600 : 400, textTransform: 'capitalize', transition: 'all 0.15s' }}>
              {s === 'all' ? '🌍 All' : s === 'remotive' ? '🌐 Remotive' : s === 'arbeitnow' ? '🇪🇺 EU Jobs' : '⛓️ Web3'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="shimmer" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="shimmer" style={{ width: '40%', height: 16, borderRadius: 4, marginBottom: 8 }} />
                  <div className="shimmer" style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 12 }} />
                  <div className="shimmer" style={{ width: '100%', height: 12, borderRadius: 4, marginBottom: 6 }} />
                  <div className="shimmer" style={{ width: '80%', height: 12, borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="shimmer" style={{ width: 50, height: 20, borderRadius: 4 }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div style={{ display: 'grid', gap: 14 }}>
              {currentJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ borderColor: '#1a7a4a', boxShadow: '0 8px 30px rgba(26,122,74,0.15)' }}
                  style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '20px', cursor: 'default', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                >
                  <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  {/* Company Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: getGradient(job.company), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: 0.5 }}>
                    {getInitials(job.company)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: text }}>{job.title}</h3>
                          {isHot(job.postedAt) && (
                            <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>🔥 Hot</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: muted }}>{job.company}</span>
                          <MapPin size={12} style={{ color: muted }} />
                          <span style={{ fontSize: 13, color: muted }}>{job.location}</span>
                          <Clock size={12} style={{ color: muted }} />
                          <span style={{ fontSize: 13, color: muted }}>{timeAgo(job.postedAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {/* Match score bar */}
                        {job.matchScore > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(job.matchScore, 100)}%`, height: '100%', background: '#1a7a4a', borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#1a7a4a', fontWeight: 700 }}>{job.matchScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: muted, margin: '8px 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                      {job.description}
                    </p>

                    {/* Salary */}
                    {job.salary && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <DollarSign size={16} style={{ color: '#1a7a4a' }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a7a4a' }}>{job.salary}</span>
                      </div>
                    )}

                    {/* Tags - horizontal scroll pills */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4, scrollbarWidth: 'none' }}>
                      {(job.tags || []).map((t: string) => (
                        <span key={t} style={{ fontSize: 11, background: '#e8f5ee', color: '#1a7a4a', padding: '3px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</span>
                      ))}
                    </div>

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => openApply(job)} style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} /> Apply
                      </button>
                      <button onClick={() => saveJob(job)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: savedIds.includes(job.id) ? '#1a7a4a' : muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {savedIds.includes(job.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>
                      <a href={job.url} target="_blank" rel="noreferrer" style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        View <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                  </div>
                  <SalaryInsights job={job} darkMode={darkMode} userSkills={profile?.skills || []} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ color: muted }}>No jobs found. Try a different search.</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, paddingBottom: 20 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: cardBg, color: page === 1 ? '#ccc' : text, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${p === page ? '#1a7a4a' : border}`, background: p === page ? '#1a7a4a' : cardBg, color: p === page ? '#fff' : text, cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, minWidth: 36 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: cardBg, color: page === totalPages ? '#ccc' : text, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>
              Next
            </button>
          </div>
        )}

        {/* Apply Modal */}
        {applyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: text, marginBottom: 4 }}>Apply to {applyModal.company}</h3>
              <p style={{ fontSize: 13, color: muted, marginBottom: 20 }}>{applyModal.title}</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>HR Email *</label>
                <div style={{ position: 'relative' }}>
                  <input value={hrEmail} onChange={e => setHrEmail(e.target.value)} placeholder="hr@company.com"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, background: darkMode ? '#0f172a' : cardBg, color: text, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={findHrEmail} disabled={findingEmail} style={{ padding: '8px 14px', border: `1px solid ${border}`, borderRadius: 8, cursor: findingEmail ? 'not-allowed' : 'pointer', background: 'none', color: text, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🔍</span> Auto-find
                    {findingEmail && <span style={{ opacity: 0.6 }}>...</span>}
                  </button>
                </div>
                {showEmailDropdown && emailResults.length > 0 && (
                  <div style={{ position: 'relative', marginTop: 8, zIndex: 50 }}>
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                      {emailResults.map((result: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => selectEmail(result.email)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            background: idx === 0 ? '#f0fdf4' : 'transparent',
                            color: text,
                            fontSize: 13,
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderBottom: idx < emailResults.length - 1 ? `1px solid ${border}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f0fdf4'}
                          onMouseOut={(e) => e.currentTarget.style.background = idx === 0 ? '#f0fdf4' : 'transparent'}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{result.email}</span>
                              <span style={{ background: '#1a7a4a', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                {result.confidence}%
                              </span>
                              {result.firstName && (
                                <span style={{ fontSize: 11, color: muted }}>
                                  {result.firstName} {result.lastName || ''}
                                </span>
                              )}
                              {result.position && (
                                <span style={{ fontSize: 11, color: muted, fontStyle: 'italic' }}>
                                  — {result.position}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>Cover letter (AI generated — edit freely)</label>
                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={10}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 13, background: darkMode ? '#0f172a' : cardBg, color: text, outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ background: '#e8f5ee', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1a7a4a', marginBottom: 20 }}>
                📧 Your resume will be linked + a CC copy goes to your email
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setApplyModal(null)} style={{ padding: '9px 18px', border: `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', background: 'none', color: text, fontSize: 14 }}>Cancel</button>
                <button onClick={sendApplication} disabled={!!applying} style={{ padding: '9px 20px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, cursor: applying ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: applying ? 0.7 : 1 }}>
                  {applying ? 'Sending...' : '⚡ Send application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}