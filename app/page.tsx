'use client'
import { useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import Link from 'next/link'
import {
  motion, AnimatePresence, useScroll, useTransform,
  useMotionValue, useSpring, animate, useInView,
} from 'framer-motion'
import {
  Zap, Target, BarChart3, Bell, Users, Shield, ArrowRight,
  CheckCircle, Star, TrendingUp, Briefcase, Globe, ChevronDown,
} from 'lucide-react'

const companies = ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Razorpay', 'CRED', 'Zepto', 'PhonePe', 'Polygon', 'Coinbase', 'Atlassian', 'Notion']

const words = ['Apply', 'smarter,', 'land', 'faster.']

const steps = [
  { emoji: '📄', title: 'Upload resume', desc: 'Drop your PDF. AI reads every line — skills, experience, everything.' },
  { emoji: '🎯', title: 'Get matched', desc: 'See a match score for every job. Filtered for your skills and target location.' },
  { emoji: '⚡', title: 'Apply in one click', desc: 'Personalized cover letter + resume sent directly to HR. CC copy to your inbox.' },
]

const bento = [
  { icon: Target, title: 'AI Job Matching', desc: 'Your resume is parsed by AI and scored against every job. Only high-match roles land in your feed.', span: 2, banner: false },
  { icon: Zap, title: 'One-click apply', desc: 'A personalized cover letter and your resume go straight to HR in one tap.', span: 1, banner: false },
  { icon: BarChart3, title: 'Kanban tracker', desc: 'Move every application from Applied → Interview → Offer with a glance.', span: 1, banner: false },
  { icon: Users, title: 'Referral network', desc: 'Connect with engineers who can refer you directly at their companies.', span: 2, banner: true },
  { icon: Bell, title: 'Real-time chat', desc: 'Instant pings the moment an HR replies, a match appears, or a connection accepts.', span: 2, banner: false },
]

const testis = [
  { name: 'Arjun S.', loc: 'Bangalore', initial: 'A', color: '#0ea5e9', text: 'Got 3 interview calls in the first week. The AI matching is scary accurate for Solana roles.' },
  { name: 'Priya M.', loc: 'Mumbai', initial: 'P', color: '#f59e0b', text: 'Finally a tool that understands Indian job market. Found my current role at Razorpay through Clover.' },
  { name: 'Rahul T.', loc: 'Indore', initial: 'R', color: '#ef4444', text: 'The referral network is gold. Connected with a Google SDE who referred me directly.' },
]

const plan = [
  'Unlimited job applications',
  'AI resume parsing',
  'Skill-matched job feed',
  'Kanban application tracker',
  'Referral network access',
  'Real-time chat',
  'Email notifications',
  'Mobile app (coming soon)',
]

interface RevealProps {
  children: ReactNode
  delay?: number
  style?: React.CSSProperties
  className?: string
  whileHover?: React.ComponentProps<typeof motion.div>['whileHover']
  transition?: React.ComponentProps<typeof motion.div>['transition']
}

function Reveal({ children, delay = 0, style, className, whileHover, transition }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ...transition }}
      whileHover={whileHover}
    >
      {children}
    </motion.div>
  )
}

function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 150, damping: 15 })
  const ringY = useSpring(y, { stiffness: 150, damping: 15 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (window.innerWidth <= 768) return
      setEnabled(true)
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target as HTMLElement
      setHovered(!!t.closest('a, button, [role="button"]'))
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        style={{ x, y, translateX: '-50%', translateY: '-50%', position: 'fixed', top: 0, left: 0, width: 8, height: 8, background: '#1a7a4a', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999 }}
      />
      <motion.div
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%', position: 'fixed', top: 0, left: 0, width: 40, height: 40, border: '2px solid #1a7a4a', borderRadius: '50%', pointerEvents: 'none', zIndex: 9998 }}
        animate={{ scale: hovered ? 1.8 : 1, opacity: hovered ? 0.9 : 0.5, backgroundColor: hovered ? '#1a7a4a' : 'rgba(26,122,74,0)' }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const target = window.scrollY + el.getBoundingClientRect().top - 80
    animate(window.scrollY, target, { duration: 0.7, ease: 'easeInOut', onUpdate: v => window.scrollTo(0, v) })
  }, [])

  const heroY = useTransform(scrollY, [0, 500], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 320], [1, 0])

  const container = { visible: { transition: { staggerChildren: 0.08 } } }
  const wordPop = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  }

  const navLinks: [string, string][] = [
    ['Features', 'features'],
    ['How it works', 'how'],
    ['Pricing', 'pricing'],
  ]

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)' }}>
      <style>{`
        * { cursor: none !important; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 25s linear infinite; display: flex; width: max-content; }
        .marquee-v { mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent); overflow: hidden; }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        html { scroll-behavior: smooth; }
        html, body { overflow-x: hidden; }
        section[id] { scroll-margin-top: 90px; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        .nav-links { display: flex; align-items: center; gap: 26px; }
        .nav-item { background: none; border: none; font-size: 14.5px; font-weight: 500; color: #334155; cursor: pointer; padding: 6px 2px; }
        .nav-item:hover { color: #1a7a4a; }
        .burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .burger span { display: block; width: 22px; height: 2px; background: #1a1a1a; border-radius: 2px; }
        .bento-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .bento-card { border: 1px solid #e5e7eb; transition: box-shadow .25s ease, border-color .25s ease; }
        .bento-card:hover { border-color: #1a7a4a; box-shadow: 0 16px 40px rgba(26, 122, 74, 0.12); }
        .testy { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 36px; }
        @media (max-width: 768px) {
          * { cursor: auto !important; }
          .hero-grid { grid-template-columns: 1fr; gap: 48px; }
          .nav-links { display: none; }
          .burger { display: flex; }
          .bento-grid { grid-template-columns: 1fr; }
          .testy { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x proximity; }
          .testy > * { min-width: 72%; flex-shrink: 0; scroll-snap-align: start; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px; }
        }
      `}</style>

      <CustomCursor />

      {/* ============ NAVBAR ============ */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0, boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.08)' : '0 0 0 rgba(0,0,0,0)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(229,231,235,0.8)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 22 }}>🍀</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Clover</span>
          </Link>

          <nav className="nav-links">
            {navLinks.map(([label, id]) => (
              <button key={label} className="nav-item" onClick={() => scrollTo(id)}>{label}</button>
            ))}
            <Link href="/network" style={{ textDecoration: 'none', color: '#334155', fontSize: 14.5, fontWeight: 500 }} className="nav-item">Network</Link>
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="burger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
            <div className="nav-links" style={{ gap: 10 }}>
              <Link href="/login" style={{ padding: '9px 18px', color: '#334155', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 999, border: '1px solid #e5e7eb' }}>Sign in</Link>
              <Link href="/register" style={{ padding: '10px 20px', background: '#1a7a4a', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, borderRadius: 999, boxShadow: '0 4px 14px rgba(26,122,74,0.3)' }}>Get started</Link>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden', borderTop: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.95)' }}
            >
              <div style={{ padding: '14px 24px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navLinks.map(([label, id]) => (
                  <button key={label} className="nav-item" style={{ textAlign: 'left', padding: '10px 0', fontSize: 15 }} onClick={() => { setMenuOpen(false); scrollTo(id) }}>{label}</button>
                ))}
                <Link href="/network" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', padding: '10px 0', fontSize: 15, fontWeight: 500 }}>Network</Link>
                <div style={{ height: 1, background: '#eef0f3', margin: '8px 0' }} />
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ textAlign: 'center', padding: '10px', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', color: '#334155', fontSize: 14, fontWeight: 500 }}>Sign in</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ textAlign: 'center', padding: '11px', background: '#1a7a4a', borderRadius: 10, textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 600 }}>Get started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============ HERO ============ */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '60px 24px 90px' }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="hero-grid">
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f5ee', border: '1px solid #1a7a4a', color: '#1a7a4a', padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 26 }}
            >
              🚀 Trusted by 500+ job seekers
            </motion.div>

            <motion.h1
              variants={container}
              initial="hidden"
              animate="visible"
              style={{ fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.08, margin: '0 auto 24px', maxWidth: 720 }}
            >
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  variants={wordPop}
                  style={{
                    display: 'inline-block',
                    marginRight: i < words.length - 1 ? 14 : 0,
                    ...(i >= 2
                      ? { backgroundImage: 'linear-gradient(135deg, #1a7a4a, #10b981)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }
                      : { color: '#0f172a' }),
                  }}
                >
                  {w}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ fontSize: 18, color: '#555', maxWidth: 560, margin: '0 auto 34px', lineHeight: 1.65 }}
            >
              Upload your resume. Get AI-matched to the right jobs. Apply in one click. Track everything — free, forever.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}
            >
              <motion.div whileHover={{ scale: 1.04, boxShadow: '0 16px 40px rgba(26,122,74,0.4)' }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#1a7a4a', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 600, borderRadius: 12, boxShadow: '0 8px 24px rgba(26,122,74,0.3)' }}>
                  Start for free <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <button onClick={() => scrollTo('how')} style={{ padding: '15px 30px', background: '#fff', color: '#0f172a', textDecoration: 'none', fontSize: 16, fontWeight: 500, borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  See how it works
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {['🎯 AI-matched jobs', '⚡ One-click apply', '📊 Track everything'].map((s, i) => (
                <motion.span key={s} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }} style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 500, color: '#334155' }}>
                  {s}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.7 }}>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ maxWidth: 460, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 30px 70px rgba(15,23,42,0.18)', padding: 24, border: '1px solid #eef0f3' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ee', color: '#1a7a4a', padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, marginBottom: 20 }}>
                ✨ New match: 94% — Solana Dev
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>My applications</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}><Briefcase size={11} style={{ verticalAlign: -1 }} /> 4 active this week</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1a7a4a', fontSize: 13, fontWeight: 600 }}>
                  <TrendingUp size={16} /> +12%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {[['Applied', 3], ['Interview', 1], ['Offer', 0]].map(([label, n]) => (
                  <div key={label as string} style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{n}</p>
                    <p style={{ fontSize: 10.5, color: '#94a3b8' }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Solana Dev', 94], ['React Frontend', 88], ['Backend Engineer', 76]].map(([label, pct]) => (
                  <div key={label as string}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                      <span>{label}</span><span style={{ color: '#1a7a4a' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 1.4, duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #1a7a4a, #10b981)', borderRadius: 999 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', color: '#94a3b8' }}
        >
          <ChevronDown size={26} />
        </motion.div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section id="companies" style={{ background: '#fff', padding: '44px 24px 52px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', fontSize: 14, fontWeight: 500, marginBottom: 28 }}>
            <Globe size={16} style={{ color: '#1a7a4a' }} /> Jobs from companies like these
          </p>
          <div className="marquee-v">
            <div className="marquee-track">
              {[...companies, ...companies].map((c, i) => (
                <span key={`${c}-${i}`} style={{ fontSize: 22, fontWeight: 700, color: '#cbd5e1', padding: '0 34px', whiteSpace: 'nowrap' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" style={{ background: '#f9fafb', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>How it works</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 64 }}>Three steps between you and your next role.</p>
          </Reveal>

          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
            <div className="step-line" style={{ position: 'absolute', top: 32, left: '12%', right: '12%', borderTop: '2px dashed #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={0.15 * i}>
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, background: '#f9fafb' }}>
                    <div style={{ width: 64, height: 64, margin: '0 auto 18px', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5ee', borderRadius: '50%', border: '2px solid #1a7a4a' }}>
                      {s.emoji}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1a7a4a', letterSpacing: 1, marginBottom: 6 }}>STEP {i + 1}</p>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 14.5, color: '#666', lineHeight: 1.65, maxWidth: 260, margin: '0 auto' }}>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES BENTO ============ */}
      <section id="features" style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Everything you need to land</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 56 }}>Your whole job hunt, in one place — free forever.</p>
          </Reveal>

          <div className="bento-grid">
            {bento.map((f, i) => (
              <Reveal
                key={f.title}
                delay={0.08 * i}
                className="bento-card"
                style={{ gridColumn: f.span >= 2 ? '1 / -1' : undefined, background: '#fff', borderRadius: 20, padding: f.banner ? 26 : 30, cursor: 'pointer' }}
                whileHover={{ scale: 1.01 }}
              >
                <div style={{ display: 'flex', flexDirection: f.banner ? 'row' : 'column', alignItems: f.banner ? 'center' : 'flex-start', gap: f.banner ? 22 : 0 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a7a4a', flexShrink: 0, marginBottom: f.banner ? 0 : 20 }}>
                    <f.icon size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 15, color: '#666', lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section style={{ background: '#f9fafb', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Loved by job seekers</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 56 }}>Real people, real offers.</p>
          </Reveal>

          <div className="testy">
            {testis.map((t, i) => (
              <Reveal key={t.name} delay={0.12 * i}>
                <div style={{ position: 'relative', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 30, height: '100%' }}>
                  <span style={{ position: 'absolute', top: 6, right: 22, fontSize: 88, lineHeight: 1, color: '#1a7a4a', opacity: 0.12, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{'\u201C'}</span>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 22, position: 'relative' }}>{t.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {t.initial}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{t.name}</p>
                      <p style={{ fontSize: 12.5, color: '#94a3b8' }}>{t.loc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Pricing</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 56 }}>Simple as it should be.</p>
          </Reveal>

          <Reveal delay={0.15}>
            <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 24px 60px rgba(15,23,42,0.08)', padding: '44px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Free Forever 🎉</h3>
              </div>
              <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 24 }}>Everything you need to land your dream job.</p>
              <p style={{ fontSize: 44, fontWeight: 800, color: '#0f172a', marginBottom: 28 }}>
                ₹0<span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}> / month</span>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: '#334155' }}>
                    <CheckCircle size={19} color="#1a7a4a" style={{ flexShrink: 0 }} /> {p}
                  </div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '15px', background: '#1a7a4a', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 600, borderRadius: 12, boxShadow: '0 8px 24px rgba(26,122,74,0.3)' }}>
                  Get started free <ArrowRight size={18} />
                </Link>
              </motion.div>

              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12.5, color: '#94a3b8', marginTop: 20 }}>
                <Shield size={14} color="#1a7a4a" /> No credit card. No hidden fees. Always free.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section style={{ background: '#f9fafb', padding: '24px 24px 80px' }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, margin: '0 24px', background: 'linear-gradient(135deg, #1a7a4a, #10b981)', padding: '76px 32px', textAlign: 'center', color: '#fff' }}>
            <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: '#fff', opacity: 0.15, filter: 'blur(60px)', top: -120, right: -60 }} />
            <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#0ea5e9', opacity: 0.2, filter: 'blur(60px)', bottom: -100, left: -40 }} />

            <h2 style={{ position: 'relative', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14 }}>Ready to land your dream job?</h2>
            <p style={{ position: 'relative', fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 32 }}>Join thousands of developers using Clover. Free, forever.</p>
            <motion.div style={{ position: 'relative', display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 34px', background: '#fff', color: '#1a7a4a', textDecoration: 'none', fontSize: 16, fontWeight: 700, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                Start applying <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: '#fff', borderTop: '1px solid #eef0f3', padding: '64px 24px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>🍀</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Clover</span>
              </Link>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65, maxWidth: 240, marginBottom: 18 }}>AI-matched jobs, one-click applications, and a referral network that actually works.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['𝕏', 'in', 'gh'].map(s => (
                  <span key={s} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748b' }}>{s}</span>
                ))}
              </div>
            </div>
            {[
              { h: 'Product', items: [['Features', 'features'], ['How it works', 'how'], ['Pricing', 'pricing'], ['Changelog', '']] },
              { h: 'Company', items: [['About', ''], ['Blog', ''], ['Careers', '']] },
              { h: 'Legal', items: [['Privacy Policy', '/privacy'], ['Terms', '/terms']] },
            ].map(col => (
              <div key={col.h}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{col.h}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.items.map(([label, href]) =>
                    href === 'features' || href === 'how' || href === 'pricing' ? (
                      <button key={label} className="nav-item" style={{ fontSize: 14, color: '#888', textAlign: 'left', padding: 0 }} onClick={() => scrollTo(href)}>{label}</button>
                    ) : href === '' ? (
                      <span key={label} style={{ fontSize: 14, color: '#888', cursor: 'default' }}>{label}</span>
                    ) : (
                      <Link key={label} href={href} style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>{label}</Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTop: '1px solid #eef0f3', marginTop: 48, paddingTop: 24 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>© 2025 Clover · Built with 🍀 in India</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Made for developers, by developers</span>
          </div>
        </div>
      </footer>
    </div>
  )
}