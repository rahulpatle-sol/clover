'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'

type Question = {
  id: string
  question: string
  category: string
  difficulty: string
  hint: string
  sampleAnswer: string
}

type Session = {
  id: string
  job_title: string
  company: string
  job_description: string
  questions: Question[]
  current_index: number
  practice_history: { questionId: string; answer: string; rating: number; strengths: string; improvements: string }[]
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { key: 'Technical', label: '💻 Technical', color: '#3b82f6', count: 4 },
  { key: 'Behavioral', label: '🤝 Behavioral', color: '#8b5cf6', count: 3 },
  { key: 'Company-specific', label: '🏢 Company', color: '#f59e0b', count: 2 },
  { key: 'Salary/HR', label: '💰 Salary/HR', color: '#ec4899', count: 1 },
]

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy: { bg: '#dcfce7', text: '#166534' },
  Medium: { bg: '#fef9c3', text: '#854d0e' },
  Hard: { bg: '#fee2e2', text: '#991b1b' },
}

export default function InterviewPrepPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [showHint, setShowHint] = useState<Record<string, boolean>>({})
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({})
  const [practiceModal, setPracticeModal] = useState<Question | null>(null)
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [practiceRating, setPracticeRating] = useState<number | null>(null)
  const [practiceFeedback, setPracticeFeedback] = useState<{ strengths: string; improvements: string } | null>(null)
  const [practiceSubmitting, setPracticeSubmitting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showSessions, setShowSessions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: sess } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSessions(sess || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [timerRunning])

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function generateQuestions() {
    if (!jobTitle.trim() || !company.trim()) {
      showToastMsg('Please enter job title and company')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')
      const qs = data.questions.map((q: Question, i: number) => ({ ...q, id: `q-${Date.now()}-${i}` }))
      setQuestions(qs)
      setShowHint({})
      setShowAnswer({})
      showToastMsg(`Generated ${qs.length} questions! 🎯`)
    } catch (e) {
      const err = e as Error
      showToastMsg(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function saveSession() {
    if (questions.length === 0 || !user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('interview_sessions').insert({
        user_id: user.id,
        job_title: jobTitle,
        company: company,
        job_description: jobDescription,
        questions: questions,
        current_index: 0,
        practice_history: []
      })
      if (error) throw error
      showToastMsg('Session saved! 💾')
      const { data: sess } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (sess?.[0]) setSessions(prev => [sess[0], ...prev])
    } catch (e) {
      const err = e as Error
      showToastMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function resumeSession(session: Session) {
    setJobTitle(session.job_title)
    setCompany(session.company)
    setJobDescription(session.job_description)
    setQuestions(session.questions)
    setShowHint({})
    setShowAnswer({})
    showToastMsg(`Resumed: ${session.job_title} at ${session.company}`)
    setShowSessions(false)
  }

  async function deleteSession(id: string) {
    await supabase.from('interview_sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
    showToastMsg('Session deleted')
  }

  function openPractice(q: Question) {
    setPracticeModal(q)
    setPracticeAnswer('')
    setPracticeRating(null)
    setPracticeFeedback(null)
    setTimer(0)
    setTimerRunning(true)
  }

  function closePractice() {
    setPracticeModal(null)
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function submitPractice() {
    if (!practiceModal || !practiceAnswer.trim()) return
    setPracticeSubmitting(true)
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('AI not configured')

      const prompt = `Rate this interview answer 1-10 and provide feedback.
Question: ${practiceModal.question}
Category: ${practiceModal.category}
User Answer: ${practiceAnswer}

Return ONLY valid JSON:
{
  "rating": number (1-10),
  "strengths": "string",
  "improvements": "string"
}`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        }
      )
      const data = await res.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const clean = content.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setPracticeRating(parsed.rating)
      setPracticeFeedback({ strengths: parsed.strengths, improvements: parsed.improvements })
      setTimerRunning(false)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch {
      showToastMsg('Failed to rate answer')
    } finally {
      setPracticeSubmitting(false)
    }
  }

  function nextQuestion() {
    if (!practiceModal) return
    const currentIndex = questions.findIndex(q => q.id === practiceModal.id)
    const nextIndex = (currentIndex + 1) % questions.length
    openPractice(questions[nextIndex])
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const questionsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    questions: questions.filter(q => q.category === cat.key)
  }))

  const bg = '#f9fafb'
  const cardBg = '#fff'
  const border = '#e5e7eb'
  const text = '#1a1a1a'
  const muted = '#888'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
        <p style={{ color: muted }}>Loading interview prep...</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, color: text }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto' }}>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a7a4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {toast}
          </motion.div>
        )}

        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: text }}>🎯 Interview Prep</h1>
            <p style={{ fontSize: 14, color: muted, marginTop: 4 }}>Generate tailored questions and practice with AI feedback</p>
          </div>

          {/* Input Section */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 20 }}>📝 Job Details</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>Job Title *</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Senior Frontend Engineer"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>Company Name *</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Google"
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 6 }}>Job Description (optional)</label>
                <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={4} placeholder="Paste the job description here for more tailored questions..."
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={generateQuestions} disabled={generating || !jobTitle.trim() || !company.trim()}
                  style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: generating || !jobTitle.trim() || !company.trim() ? 'not-allowed' : 'pointer', opacity: generating || !jobTitle.trim() || !company.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {generating ? '⏳ Generating...' : '🤖 Generate Questions'}
                </button>
                <button onClick={saveSession} disabled={saving || questions.length === 0}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: saving || questions.length === 0 ? 'not-allowed' : 'pointer', opacity: saving || questions.length === 0 ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving ? '💾 Saving...' : '💾 Save Session'}
                </button>
                <button onClick={() => setShowSessions(!showSessions)}
                  style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '12px 20px', fontSize: 14, cursor: 'pointer', color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📁 {showSessions ? 'Hide' : 'Show'} Past Sessions ({sessions.length})
                </button>
              </div>
            </div>
          </div>

          {/* Past Sessions */}
          <AnimatePresence>
            {showSessions && sessions.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 24, overflow: 'hidden' }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 16 }}>📁 Past Sessions</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  {sessions.map(sess => (
                    <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: `1px solid ${border}` }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{sess.job_title} at {sess.company}</div>
                        <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                          {sess.questions.length} questions • {new Date(sess.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => resumeSession(sess)} style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Resume</button>
                        <button onClick={() => deleteSession(sess.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Questions Output */}
          {questions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: text }}>📋 Generated Questions ({questions.length})</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => {
                    const count = questions.filter(q => q.category === cat.key).length
                    return (
                      <span key={cat.key} style={{ background: cat.color + '15', color: cat.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {cat.label.split(' ')[0]} {count}/{cat.count}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 20 }}>
                {questionsByCategory.map(cat => (
                  cat.questions.length > 0 && (
                    <div key={cat.key} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ background: cat.color + '15', color: cat.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{cat.label}</span>
                        <span style={{ fontSize: 12, color: muted }}>{cat.questions.length} questions</span>
                      </div>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {cat.questions.map((q, idx) => (
                          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            style={{ background: '#f9fafb', border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: text, lineHeight: 1.5, marginBottom: 8 }}>{idx + 1}. {q.question}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, background: DIFFICULTY_COLORS[q.difficulty]?.bg || '#e5e7eb', color: DIFFICULTY_COLORS[q.difficulty]?.text || '#555', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{q.difficulty}</span>
                                  <button onClick={() => setShowHint(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                    style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {showHint[q.id] ? '🙈 Hide hint' : '💡 Show hint'}
                                  </button>
                                  <button onClick={() => setShowAnswer(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                    style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {showAnswer[q.id] ? '🙈 Hide answer' : '✨ Show answer'}
                                  </button>
                                  <button onClick={() => openPractice(q)}
                                    style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    🎤 Practice
                                  </button>
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {showHint[q.id] && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 13, color: '#854d0e' }}>
                                  <strong>Hint:</strong> {q.hint}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <AnimatePresence>
                              {showAnswer[q.id] && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '12px', fontSize: 13, color: '#065f46' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong>AI Suggested Answer:</strong>
                                  </div>
                                  <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.sampleAnswer}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {questions.length === 0 && !generating && (
            <div style={{ textAlign: 'center', padding: 60, background: cardBg, border: `1px solid ${border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>Ready to practice?</h3>
              <p style={{ color: muted, marginBottom: 24 }}>Enter a job title and company above, then generate tailored interview questions powered by AI</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: muted }}>
                <span style={{ background: '#e8f5ee', color: '#1a7a4a', padding: '6px 12px', borderRadius: 20 }}>4 Technical</span>
                <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '6px 12px', borderRadius: 20 }}>3 Behavioral</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: 20 }}>2 Company</span>
                <span style={{ background: '#fce7f3', color: '#be185d', padding: '6px 12px', borderRadius: 20 }}>1 Salary/HR</span>
              </div>
            </div>
          )}

          {/* Practice Modal */}
          <AnimatePresence>
            {practiceModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24', borderBottom: `1px solid ${border}` }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: '#e8f5ee', color: '#1a7a4a', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{practiceModal.category}</span>
                        <span style={{ fontSize: 11, background: DIFFICULTY_COLORS[practiceModal.difficulty]?.bg || '#e5e7eb', color: DIFFICULTY_COLORS[practiceModal.difficulty]?.text || '#555', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{practiceModal.difficulty}</span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: text, lineHeight: 1.4 }}>{practiceModal.question}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a7a4a', fontFamily: 'monospace' }}>{formatTime(timer)}</div>
                      <div style={{ fontSize: 11, color: muted }}>Practice time</div>
                    </div>
                  </div>

                  {/* Answer Area */}
                  <div style={{ padding: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 8 }}>💬 Type your answer</label>
                    <textarea
                      value={practiceAnswer}
                      onChange={e => setPracticeAnswer(e.target.value)}
                      rows={8}
                      placeholder="Write your answer here... Speak it out loud first, then type!"
                      style={{ width: '100%', padding: '14px', border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, minHeight: 160 }}
                    />

                    {/* Submit / Feedback */}
                    {practiceRating === null ? (
                      <div style={{ marginTop: 16 }}>
                        <button onClick={submitPractice} disabled={practiceSubmitting || !practiceAnswer.trim()}
                          style={{ width: '100%', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 600, cursor: practiceSubmitting || !practiceAnswer.trim() ? 'not-allowed' : 'pointer', opacity: practiceSubmitting || !practiceAnswer.trim() ? 0.6 : 1 }}>
                          {practiceSubmitting ? '🤖 AI is rating your answer...' : '✅ Submit for AI Rating'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 10 }}>
                          <div style={{ fontSize: 48, fontWeight: 800, color: practiceRating >= 7 ? '#1a7a4a' : practiceRating >= 4 ? '#f59e0b' : '#ef4444' }}>{practiceRating}/10</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>
                              {practiceRating >= 7 ? '🎉 Excellent!' : practiceRating >= 4 ? '👍 Good effort!' : '📚 Keep practicing!'}
                            </div>
                            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>AI Evaluation</div>
                          </div>
                        </div>

                        {practiceFeedback && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#065f46' }}>
                                ✅ Strengths
                              </div>
                              <p style={{ fontSize: 13, color: '#065f46', lineHeight: 1.5 }}>{practiceFeedback.strengths}</p>
                            </div>
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#991b1b' }}>
                                📈 Improvements
                              </div>
                              <p style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>{practiceFeedback.improvements}</p>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={nextQuestion}
                            style={{ flex: 1, background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                            ➡️ Next Question
                          </button>
                          <button onClick={closePractice}
                            style={{ flex: 1, background: 'none', border: `1px solid ${border}`, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: text }}>
                            ✕ Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}