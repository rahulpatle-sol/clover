'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function ResumePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
      setProfile((p: any) => ({ ...p, resume_url: publicUrl }))
      showToast('Resume uploaded! Parsing now...')
      setParsing(true)
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.skills) {
        await supabase.from('profiles').update({ skills: data.skills, job_title: data.jobTitle, resume_text: data.text }).eq('id', user.id)
        setProfile((p: any) => ({ ...p, skills: data.skills, job_title: data.jobTitle }))
        showToast(`✅ Parsed! Found ${data.skills.length} skills`)
      }
    } catch (err: any) {
      showToast('Upload failed: ' + (err.message || 'Unknown error'))
    }
    setUploading(false)
    setParsing(false)
  }

  async function removeSkill(skill: string) {
    const newSkills = (profile?.skills || []).filter((s: string) => s !== skill)
    await supabase.from('profiles').update({ skills: newSkills }).eq('id', user.id)
    setProfile((p: any) => ({ ...p, skills: newSkills }))
  }

  async function addSkill(skill: string) {
    if (!skill.trim()) return
    const newSkills = [...(profile?.skills || []), skill.trim()]
    await supabase.from('profiles').update({ skills: newSkills }).eq('id', user.id)
    setProfile((p: any) => ({ ...p, skills: newSkills }))
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
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 13, color: muted, marginBottom: 4 }}>Detected job title</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: text }}>💼 {profile.job_title}</p>
          </div>
        )}
      </main>
    </div>
  )
}
