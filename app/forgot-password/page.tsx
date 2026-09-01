'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
  }

  if (sent) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Reset link sent!</h2>
        <p style={{ color: '#666', lineHeight: 1.6 }}>Check <strong>{email}</strong> for a password reset link.</p>
        <Link href="/login" style={{ display: 'inline-block', marginTop: 20, color: '#1a7a4a', textDecoration: 'none', fontWeight: 500 }}>← Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 28, textDecoration: 'none' }}>🍀</Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginTop: 12, marginBottom: 4 }}>Forgot password?</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Enter your email and we'll send a reset link.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 32 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
            <Link href="/login" style={{ color: '#1a7a4a', textDecoration: 'none' }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
