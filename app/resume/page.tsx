'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {CardBg} from '@/components/CardBg'
interface Profile {
  id: string
  full_name: string | null
  email: string | null
  resume_url: string | null
  skills: string[]
  job_title: string | null
  resume_text: string | null
}

interface User {
  id: string
  email: string | null
}

export default function ResumePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.type !== 'application/pdf') { showToast('Please upload a PDF file'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('File too large. Max 5MB'); return }
    setUploading(true)
    try {
      const ext = 'pdf'
      const path = `resumes/${user.id}/resume.${ext}`
      const { error: uploadErr } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path)
      await supabase.from('profiles').update({ resume_url: publicUrl }).eq('id', user.id)
      setProfile((p: Profile | null) => ({ ...p, resume_url: publicUrl }))
      showToast('Resume uploaded! Parsing now...')
      setParsing(true)
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.skills) {
        await supabase.from('profiles').update({ skills: data.skills, job_title: data.jobTitle, resume_text: data.text }).eq('id', user.id)
        setProfile((p: Profile | null) => ({ ...p, skills: data.skills, job_title: data.jobTitle }))
        showToast(`✅ Parsed! Found ${data.skills.length} skills`)
      }
    } catch (err: unknown) {
      showToast('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    setUploading(false)
    setParsing(false)
  }

  async function removeSkill(skill: string) {
    const newSkills = (profile?.skills || []).filter((s: string) => s !== skill)
    await supabase.from('profiles').update({ skills: newSkills }).eq('id', user.id)
    setProfile((p: Profile | null) => ({ ...p, skills: newSkills }))
  }

  async function addSkill(skill: string) {
    if (!skill.trim()) return
    const newSkills = [...(profile?.skills || []), skill.trim()]
    await supabase.from('profiles').update({ skills: newSkills }).eq('id', user.id)
    setProfile((p: Profile | null) => ({ ...p, skills: newSkills }))
  }

  const [newSkill, setNewSkill] = useState('')
  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
      <p style={{ color: muted }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, color: text }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px', maxWidth: 800 }}>
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a7a4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 200 }}>
            {toast}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: text }}>Resume</h1>
            <p style={{ fontSize: 13, color: muted, marginTop: 2 }}>Upload your PDF — we extract your skills automatically</p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16 }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Upload Box */}
        <div style={{ background: cardBg, border: `2px dashed ${profile?.resume_url ? '#1a7a4a' : border}`, borderRadius: 16, padding: 40, textAlign: 'center', marginBottom: 24, cursor: 'pointer' }}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          {uploading || parsing ? (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{parsing ? '🔍' : '⬆️'}</div>
              <p style={{ color: '#1a7a4a', fontWeight: 500 }}>{parsing ? 'Parsing resume with AI...' : 'Uploading...'}</p>
            </div>
          ) : profile?.resume_url ? (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#1a7a4a', fontWeight: 600, marginBottom: 6 }}>Resume uploaded</p>
              <p style={{ color: muted, fontSize: 13 }}>Click to replace</p>
              <a href={profile.resume_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-block', marginTop: 10, color: '#1a7a4a', fontSize: 13 }}>View PDF →</a>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📄</div>
              <p style={{ fontWeight: 600, color: text, marginBottom: 6 }}>Drop your resume here</p>
              <p style={{ color: muted, fontSize: 13 }}>PDF only · Max 5MB</p>
            </div>
          )}
        </div>

        {/* Skills */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 16 }}>🎯 Extracted skills ({(profile?.skills || []).length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {(profile?.skills || []).map((skill: string) => (
              <span key={skill} style={{ background: '#e8f5ee', color: '#1a7a4a', padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                {skill}
                <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a4a', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
            {(profile?.skills || []).length === 0 && (
              <p style={{ color: muted, fontSize: 13 }}>No skills found yet. Upload your resume first.</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') { addSkill(newSkill); setNewSkill('') } }}
              placeholder="Add skill manually (press Enter)"
              style={{ flex: 1, padding: '9px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 13, background: darkMode?'#0f172a':cardBg, color: text, outline: 'none' }} />
            <button onClick={() => { addSkill(newSkill); setNewSkill('') }} style={{ padding: '9px 18px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              Add
            </button>
          </div>
        </div>

        {/* Job Title */}
        {profile?.job_title && (
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: muted, marginBottom: 4 }}>Detected job title</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: text }}>💼 {profile.job_title}</p>
          </div>
        )}

        {/* ATS Score Checker */}
        <ATSScorer resumeText={profile?.resume_text || ''} darkMode={darkMode} />

      </main>
    </div>
  )
}

function ATSScorer({ resumeText, darkMode }: { resumeText: string; darkMode: boolean }) {
  const [jobDescription, setJobDescription] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [error, setError] = useState('')

  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  interface ATSResult {
    score: number
    matched: string[]
    missing: string[]
    suggestions: string[]
    verdict: 'Strong' | 'Average' | 'Weak'
  }

  const getScoreColor = (score: number) => {
    if (score < 40) return '#ef4444'
    if (score < 70) return '#f59e0b'
    return '#1a7a4a'
  }

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'Strong') return '#1a7a4a'
    if (verdict === 'Average') return '#f59e0b'
    return '#ef4444'
  }

  const animateScore = (score: number, onComplete: (value: number) => void) => {
    let current = 0
    const duration = 1200
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      current = Math.round(score * eased)
      onComplete(current)
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete(score)
      }
    }
    animate()
  }

  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (result) {
      animateScore(result.score, setAnimatedScore)
    }
  }, [result])

  async function handleCheck() {
    if (!jobDescription.trim()) {
      setError('Please paste a job description')
      return
    }
    if (!resumeText.trim()) {
      setError('No resume text found. Upload and parse a resume first.')
      return
    }

    setChecking(true)
    setError('')
    setResult(null)
    setAnimatedScore(0)

    try {
      const res = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to check ATS score')
      
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 16 }}>📊 ATS Score Checker</h2>
      <p style={{ fontSize: 13, color: muted, marginBottom: 16 }}>
        Paste a job description to see how well your resume matches
      </p>

      <textarea
        value={jobDescription}
        onChange={e => setJobDescription(e.target.value)}
        placeholder="Paste job description here..."
        style={{
          width: '100%',
          minHeight: 120,
          padding: '12px 14px',
          border: `1px solid ${border}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'inherit',
          background: darkMode ? '#0f172a' : cardBg,
          color: text,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: 12,
        }}
        disabled={checking}
      />

      <button
        onClick={handleCheck}
        disabled={checking || !jobDescription.trim()}
        style={{
          width: '100%',
          padding: '12px',
          background: checking ? '#94a3b8' : '#1a7a4a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: checking ? 'not-allowed' : 'pointer',
        }}
      >
        {checking ? 'Checking...' : 'Check ATS Score'}
      </button>

      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke={border}
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke={getScoreColor(result.score)}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (animatedScore / 100) * 213.6}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(result.score) }}>
                  {animatedScore}
                </span>
                <span style={{ fontSize: 11, color: muted }}>ATS Score</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: getVerdictColor(result.verdict), textTransform: 'uppercase', letterSpacing: 1 }}>
                {result.verdict}
              </div>
              <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
                {result.verdict === 'Strong' && 'Great match! Your resume aligns well with this role.'}
                {result.verdict === 'Average' && 'Decent match. Consider adding missing keywords.'}
                {result.verdict === 'Weak' && 'Low match. Significant gaps to address.'}
              </div>
            </div>
          </div>

          {result.matched.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a', marginBottom: 8 }}>✅ Matched keywords (${result.matched.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.matched.map((kw: string) => (
                  <span key={kw} style={{ background: '#e8f5ee', color: '#1a7a4a', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500 }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.missing.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>❌ Missing keywords (${result.missing.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.missing.map((kw: string) => (
                  <span key={kw} style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500 }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 8 }}>💡 Suggestions</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: muted, fontSize: 13, lineHeight: 1.8 }}>
                {result.suggestions.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
