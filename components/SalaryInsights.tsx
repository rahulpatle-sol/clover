'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, ChevronDown, ChevronUp, MapPin, Briefcase, MessageSquare, X, TrendingUp } from 'lucide-react'

const CITY_SALARIES: Record<string, { city: string; min: number; max: number }[]> = {
  'React': [
    { city: 'Mumbai', min: 12, max: 18 },
    { city: 'Bangalore', min: 14, max: 22 },
    { city: 'Hyderabad', min: 10, max: 18 },
    { city: 'Pune', min: 10, max: 16 },
    { city: 'Delhi NCR', min: 11, max: 19 },
    { city: 'Indore', min: 8, max: 14 },
  ],
  'Full Stack': [
    { city: 'Mumbai', min: 14, max: 24 },
    { city: 'Bangalore', min: 16, max: 28 },
    { city: 'Hyderabad', min: 12, max: 22 },
    { city: 'Pune', min: 12, max: 20 },
    { city: 'Delhi NCR', min: 13, max: 24 },
    { city: 'Indore', min: 9, max: 16 },
  ],
  'Backend': [
    { city: 'Mumbai', min: 12, max: 20 },
    { city: 'Bangalore', min: 14, max: 24 },
    { city: 'Hyderabad', min: 10, max: 20 },
    { city: 'Pune', min: 10, max: 18 },
    { city: 'Delhi NCR', min: 11, max: 20 },
    { city: 'Indore', min: 8, max: 15 },
  ],
  'default': [
    { city: 'Mumbai', min: 10, max: 18 },
    { city: 'Bangalore', min: 12, max: 22 },
    { city: 'Hyderabad', min: 9, max: 17 },
    { city: 'Pune', min: 9, max: 16 },
    { city: 'Delhi NCR', min: 10, max: 18 },
    { city: 'Indore', min: 7, max: 13 },
  ],
}

const EXPERIENCE_LEVELS = [
  { label: '0–1 yr', multiplier: 0.7, color: '#ef4444' },
  { label: '1–3 yr', multiplier: 1.0, color: '#f59e0b' },
  { label: '3–5 yr', multiplier: 1.4, color: '#10b981' },
  { label: '5+ yr', multiplier: 1.8, color: '#3b82f6' },
]

function getSalaryCategory(job: any): string {
  const text = `${job.title} ${job.tags?.join(' ') || ''}`.toLowerCase()
  if (text.includes('react') || text.includes('frontend')) return 'React'
  if (text.includes('full stack') || text.includes('fullstack')) return 'Full Stack'
  if (text.includes('backend') || text.includes('node') || text.includes('python') || text.includes('java')) return 'Backend'
  return 'default'
}

function parseSalaryRange(salary: string): { min: number; max: number } | null {
  if (!salary) return null
  const nums = salary.match(/\d+/g)
  if (!nums || nums.length === 0) return null
  if (nums.length >= 2) return { min: Math.min(...nums.map(Number)), max: Math.max(...nums.map(Number)) }
  return { min: Number(nums[0]), max: Number(nums[0]) }
}

function generateNegotiationScript(job: any, experienceIdx: number, skills: string[]): string {
  const exp = EXPERIENCE_LEVELS[experienceIdx]
  const role = job.title || 'this role'
  const company = job.company || 'your company'
  const topSkills = skills.slice(0, 3).join(', ') || 'your technical skills'
  const mult = exp.multiplier

  const base = 14
  const adjusted = Math.round(base * mult)

  return `Salary Negotiation Script for ${role} at ${company}

Opening:
"Thank you for extending this offer. I'm very excited about the ${role} position at ${company} and would love to discuss the compensation package."

Highlight Your Value:
"With my ${exp.label} of experience and expertise in ${topSkills}, I bring a unique combination of skills that directly aligns with this role. In my previous projects, I've delivered measurable impact that I'm confident I can replicate here."

The Ask:
"Based on my research and the market rate for this role with ${exp.label} experience, I'd like to discuss adjusting the package to ₹${adjusted}–${Math.round(adjusted * 1.3)} LPA. This reflects both my current skill level and the value I'll bring from day one."

If They Push Back:
"I understand there may be constraints. Would it be possible to review this after a 6-month performance assessment? I'm confident my contributions will justify the adjustment."

Closing:
"I'm committed to making a strong impact at ${company} and look forward to finding a package that works for both of us."`
}

interface SalaryInsightsProps {
  job: any
  darkMode: boolean
  userSkills?: string[]
}

export default function SalaryInsights({ job, darkMode, userSkills = [] }: SalaryInsightsProps) {
  const [expanded, setExpanded] = useState(false)
  const [expIdx, setExpIdx] = useState(1)
  const [showNegotiation, setShowNegotiation] = useState(false)

  const category = getSalaryCategory(job)
  const cityData = CITY_SALARIES[category] || CITY_SALARIES.default
  const parsed = parseSalaryRange(job.salary)
  const currentExp = EXPERIENCE_LEVELS[expIdx]

  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'
  const accent = '#1a7a4a'

  return (
    <>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: darkMode ? '#0f172a' : '#f0fdf4',
            border: `1px solid ${expanded ? accent : border}`,
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: accent,
            transition: 'all 0.2s', width: '100%', justifyContent: 'center',
          }}
        >
          <TrendingUp size={14} />
          Salary Insights
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 10, padding: 16, borderRadius: 12,
              background: darkMode ? '#0f172a' : '#f8fafc',
              border: `1px solid ${border}`,
            }}>
              {/* Salary Range from Adzuna */}
              {parsed && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Listed Salary Range
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <DollarSign size={18} style={{ color: accent }} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: accent }}>
                      ₹{parsed.min}–{parsed.max} LPA
                    </span>
                  </div>
                </div>
              )}

              {/* City-wise comparison */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  <MapPin size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                  City-wise Comparison — {job.title?.split(' ')[0] || 'Role'} Dev Salary
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {cityData.map((c) => {
                    const isCurrentLocation = job.location?.toLowerCase().includes(c.city.toLowerCase())
                    return (
                      <div key={c.city} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', borderRadius: 6,
                        background: isCurrentLocation ? (darkMode ? '#1a3a2a' : '#e8f5ee') : 'transparent',
                        border: isCurrentLocation ? `1px solid ${accent}33` : '1px solid transparent',
                      }}>
                        <span style={{ fontSize: 13, color: isCurrentLocation ? accent : text, fontWeight: isCurrentLocation ? 600 : 400 }}>
                          {c.city}
                          {isCurrentLocation && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.7 }}>(this job)</span>}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isCurrentLocation ? accent : text }}>
                          ₹{c.min}–{c.max} LPA
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Experience multiplier */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  <Briefcase size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                  Experience Multiplier
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {EXPERIENCE_LEVELS.map((lvl, i) => (
                    <button
                      key={lvl.label}
                      onClick={() => setExpIdx(i)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${i === expIdx ? lvl.color : border}`,
                        background: i === expIdx ? `${lvl.color}15` : 'transparent',
                        color: i === expIdx ? lvl.color : muted,
                        fontSize: 11, fontWeight: i === expIdx ? 700 : 500,
                        transition: 'all 0.15s', textAlign: 'center',
                      }}
                    >
                      <div>{lvl.label}</div>
                      <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{lvl.multiplier}x</div>
                    </button>
                  ))}
                </div>
                {parsed && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    background: darkMode ? '#1e293b' : '#fff',
                    border: `1px solid ${border}`,
                    fontSize: 13, color: text,
                  }}>
                    Adjusted estimate: <strong style={{ color: accent }}>
                      ₹{Math.round(parsed.min * currentExp.multiplier)}–{Math.round(parsed.max * currentExp.multiplier)} LPA
                    </strong>
                    <span style={{ fontSize: 11, color: muted, marginLeft: 6 }}>({currentExp.label})</span>
                  </div>
                )}
              </div>

              {/* Negotiation helper */}
              <button
                onClick={() => setShowNegotiation(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                  background: accent, color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
                }}
              >
                <MessageSquare size={14} />
                Get negotiation script →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Negotiation Modal */}
      <AnimatePresence>
        {showNegotiation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: 20,
            }}
            onClick={() => setShowNegotiation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: cardBg, borderRadius: 16, padding: 28,
                width: '100%', maxWidth: 580, maxHeight: '85vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: text, margin: 0 }}>
                    Negotiation Script
                  </h3>
                  <p style={{ fontSize: 12, color: muted, margin: '4px 0 0' }}>
                    AI-generated based on your experience ({currentExp.label})
                  </p>
                </div>
                <button
                  onClick={() => setShowNegotiation(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: muted, padding: 4, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{
                background: darkMode ? '#0f172a' : '#f8fafc',
                border: `1px solid ${border}`, borderRadius: 10,
                padding: 16, fontSize: 13, lineHeight: 1.8, color: text,
                whiteSpace: 'pre-wrap',
              }}>
                {generateNegotiationScript(job, expIdx, userSkills)}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(generateNegotiationScript(job, expIdx, userSkills))
                  }}
                  style={{
                    padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                    background: 'none', border: `1px solid ${border}`,
                    color: text, fontSize: 13, fontWeight: 500,
                  }}
                >
                  Copy script
                </button>
                <button
                  onClick={() => setShowNegotiation(false)}
                  style={{
                    padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
                    background: accent, color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
