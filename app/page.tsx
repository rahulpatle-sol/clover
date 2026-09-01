'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'

gsap.registerPlugin(ScrollTrigger)

const features = [
  { icon: '📄', title: 'Resume parsing', desc: 'Upload your PDF resume — we extract your skills automatically using AI.' },
  { icon: '🎯', title: 'Skill-matched jobs', desc: 'See a match score for every job based on your actual skills.' },
  { icon: '⚡', title: 'One-click apply', desc: 'Apply to any job instantly — a personalised email goes straight to HR.' },
  { icon: '📊', title: 'Kanban tracker', desc: 'Track every application from Applied → Interview → Offer.' },
  { icon: '🔔', title: 'New job alerts', desc: 'Get notified the moment a high-match job lands in your feed.' },
  { icon: '🌍', title: 'Global + Web3 jobs', desc: 'Pulls from Remotive, Arbeitnow, Web3.career and more — daily.' },
]

const steps = [
  { num: '1', title: 'Upload resume', desc: 'Drop your PDF. Our parser extracts skills, title, and experience.' },
  { num: '2', title: 'See your matches', desc: 'Jobs ranked by how closely they match your extracted skills.' },
  { num: '3', title: 'Apply in one click', desc: 'A personalised cover letter and your resume go to the HR email.' },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from('.hero-badge', { opacity: 0, y: -20, duration: 0.5, delay: 0.1 })
      gsap.from('.hero-title', { opacity: 0, y: 30, duration: 0.7, delay: 0.2, ease: 'power3.out' })
      gsap.from('.hero-sub', { opacity: 0, y: 20, duration: 0.6, delay: 0.4 })
      gsap.from('.hero-btns', { opacity: 0, y: 20, duration: 0.6, delay: 0.55 })
      gsap.from('.hero-stats', { opacity: 0, y: 20, duration: 0.6, delay: 0.7, stagger: 0.1 })

      // Feature cards scroll reveal
      gsap.from('.feature-card', {
        opacity: 0, y: 40, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.features-grid', start: 'top 80%' }
      })

      // Steps
      gsap.from('.step-item', {
        opacity: 0, x: -30, duration: 0.5, stagger: 0.15,
        scrollTrigger: { trigger: '.steps-row', start: 'top 80%' }
      })

      // CTA section
      gsap.from('.cta-box', {
        opacity: 0, scale: 0.97, duration: 0.6,
        scrollTrigger: { trigger: '.cta-box', start: 'top 85%' }
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>🍀</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>Clover</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login" style={{ padding: '8px 16px', color: '#555', textDecoration: 'none', fontSize: 14, borderRadius: 8 }}>Sign in</Link>
          <Link href="/register" style={{ padding: '8px 18px', background: '#1a7a4a', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8 }}>Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ee', color: '#1a7a4a', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
          <span>🍀</span> Free forever · No credit card needed
        </div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.15, margin: '0 auto 20px', maxWidth: 720 }}>
          Apply smarter,<br />
          <span style={{ color: '#1a7a4a' }}>land faster.</span>
        </h1>
        <p className="hero-sub" style={{ fontSize: 18, color: '#666', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Upload your resume. Clover matches you with the right jobs and sends your application in one click.
        </p>
        <div className="hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link href="/register" style={{ padding: '13px 28px', background: '#1a7a4a', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600, borderRadius: 10, boxShadow: '0 2px 8px rgba(26,122,74,0.25)' }}>
            Start for free →
          </Link>
          <Link href="#features" style={{ padding: '13px 28px', background: '#fff', color: '#1a1a1a', textDecoration: 'none', fontSize: 15, fontWeight: 500, borderRadius: 10, border: '1px solid #e5e7eb' }}>
            See how it works
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['500+', 'Job sources daily'], ['1-click', 'Email apply'], ['AI-powered', 'Skill matching']].map(([v, l]) => (
            <div key={l} className="hero-stats" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a7a4a' }}>{v}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#fff', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 48 }}>How it works</h2>
          <div className="steps-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
            {steps.map(s => (
              <div key={s.num} className="step-item" style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, background: '#e8f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, fontWeight: 700, color: '#1a7a4a' }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '64px 24px' }} ref={featuresRef}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Everything you need</h2>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: 48, fontSize: 15 }}>One tool to find, track, and apply to jobs — for free.</p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {features.map(f => (
              <div key={f.title} className="feature-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '48px 24px 80px' }}>
        <div className="cta-box" style={{ maxWidth: 560, margin: '0 auto', background: '#1a7a4a', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Ready to apply smarter?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: 15 }}>Join thousands of developers using Clover to land their next role.</p>
          <Link href="/register" style={{ padding: '13px 32px', background: '#fff', color: '#1a7a4a', textDecoration: 'none', fontSize: 15, fontWeight: 700, borderRadius: 10 }}>
            Get started free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: '#999', fontSize: 13 }}>🍀 Clover © {new Date().getFullYear()}</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/privacy" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>Privacy policy</Link>
          <Link href="/terms" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
        </div>
      </footer>
    </div>
  )
}
