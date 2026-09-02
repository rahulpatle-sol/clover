'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Users, Briefcase, MapPin, Star, CheckCircle, Search, Plus, MessageCircle, Clock, Building2, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function getAvatarColor(name: string) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f5576c 0%, #ff6a00 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    const duration = 600
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span>{count}</span>
}

function SkeletonCard({ darkMode }: { darkMode: boolean }) {
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const shimmer = darkMode
    ? 'linear-gradient(90deg, #1e293b 25%, #2d3a4f 50%, #1e293b 75%)'
    : 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)'
  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 28, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: shimmer, backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, width: '70%', borderRadius: 6, background: shimmer, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 }} />
          <div style={{ height: 12, width: '50%', borderRadius: 6, background: shimmer, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div style={{ height: 12, width: '90%', borderRadius: 6, background: shimmer, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 10 }} />
      <div style={{ height: 12, width: '60%', borderRadius: 6, background: shimmer, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 20 }} />
      <div style={{ height: 40, borderRadius: 10, background: shimmer, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    </div>
  )
}

export default function NetworkPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [referrers, setReferrers] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('')
  const [toast, setToast] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [myPost, setMyPost] = useState<any>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postForm, setPostForm] = useState({ company:'', role:'', bio:'', is_referrer: true })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: posts } = await supabase.from('referral_posts').select('*, profiles(full_name,job_title,avatar_url)').order('created_at', { ascending: false })
      setReferrers(posts || [])
      const { data: myPostData } = await supabase.from('referral_posts').select('*').eq('user_id', user.id).single()
      setMyPost(myPostData)
      const { data: reqs } = await supabase.from('referral_requests').select('*, referral_posts(company,role), profiles!referral_requests_from_user_id_fkey(full_name)').or(`to_user_id.eq.${user.id},from_user_id.eq.${user.id}`)
      setRequests(reqs || [])
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function sendRequest(post: any) {
    if (post.user_id === user.id) { showToast("That's your own post!"); return }
    const { error } = await supabase.from('referral_requests').insert({ from_user_id: user.id, to_user_id: post.user_id, post_id: post.id, status: 'pending' })
    if (error) { showToast(error.code === '23505' ? 'Request already sent!' : 'Failed to send request'); return }
    showToast('Connect request sent!')
  }

  async function respondRequest(id: string, status: string) {
    await supabase.from('referral_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    showToast(status === 'accepted' ? 'Connection accepted!' : 'Request declined')
  }

  async function savePost() {
    if (!postForm.company || !postForm.role) { showToast('Fill company and role'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('referral_posts')
        .upsert({ ...postForm, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      setMyPost(data)
      showToast(data.id ? 'Profile updated!' : 'Joined network! ✅')
      setShowPostForm(false)
    } catch (err: any) {
      showToast('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = referrers.filter(r => {
    const q = search.toLowerCase()
    const co = company.toLowerCase()
    return (!q || r.company?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q)) &&
      (!co || r.company?.toLowerCase().includes(co))
  })

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#ffffff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#6b7280'
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const connectedCount = requests.filter(r => r.status === 'accepted').length
  const primary = '#1a7a4a'
  const primaryLight = darkMode ? '#1a5c38' : '#e8f5ee'

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 28, width: 220, borderRadius: 8, background: darkMode ? '#334155' : '#e5e7eb', marginBottom: 8, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
          <div style={{ height: 14, width: 320, borderRadius: 6, background: darkMode ? '#334155' : '#e5e7eb', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <SkeletonCard darkMode={darkMode} />
          <SkeletonCard darkMode={darkMode} />
          <SkeletonCard darkMode={darkMode} />
        </div>
      </main>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              style={{
                position: 'fixed', bottom: 24, right: 24, background: primary, color: '#fff',
                padding: '14px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 200,
                boxShadow: '0 8px 32px rgba(26,122,74,0.3)'
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: text, letterSpacing: '-0.02em' }}>Referral Network</h1>
            <p style={{ fontSize: 14, color: muted, marginTop: 4 }}>Connect with people who can refer you</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setPostForm(myPost || { company:'', role:'', bio:'', is_referrer:true }); setShowPostForm(true) }}
              style={{ background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(26,122,74,0.3)' }}
            >
              <Plus size={16} />
              {myPost ? 'Edit my post' : 'Join network'}
            </motion.button>
          </div>
        </div>

        {/* Top Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Referrers', value: filtered.length, icon: <Users size={20} />, gradient: 'linear-gradient(135deg, #1a7a4a 0%, #22c55e 100%)' },
            { label: 'Connected', value: connectedCount, icon: <CheckCircle size={20} />, gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' },
            { label: 'Pending Requests', value: pendingCount, icon: <Clock size={20} />, gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: darkMode
                  ? 'rgba(30,41,59,0.8)'
                  : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: stat.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: text, lineHeight: 1 }}>
                  <AnimatedCounter value={stat.value} />
                </p>
                <p style={{ fontSize: 13, color: muted, marginTop: 2 }}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pending Requests */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: cardBg,
                border: `1px solid ${darkMode ? '#92400e' : '#fbbf24'}`,
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: text }}>
                  Pending requests ({pendingCount})
                </h3>
              </div>
              {requests.filter(r => r.status === 'pending').map(r => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: text }}>{r.profiles?.full_name || 'Someone'}</p>
                    <p style={{ fontSize: 12, color: muted, marginTop: 2 }}>Wants referral at {r.referral_posts?.company}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => respondRequest(r.id, 'accepted')}
                      style={{ background: primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Accept
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => respondRequest(r.id, 'rejected')}
                      style={{ background: 'none', border: `1px solid #ef4444`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, color: '#ef4444', fontWeight: 500 }}
                    >
                      Decline
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search / Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              style={{
                width: '100%', padding: '12px 14px 12px 42px',
                border: `1px solid ${border}`, borderRadius: 12,
                fontSize: 14, background: cardBg, color: text, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = primary)}
              onBlur={e => (e.currentTarget.style.borderColor = border)}
            />
          </div>
          <div style={{ width: 220, position: 'relative' }}>
            <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Filter by company..."
              style={{
                width: '100%', padding: '12px 14px 12px 42px',
                border: `1px solid ${border}`, borderRadius: 12,
                fontSize: 14, background: cardBg, color: text, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = primary)}
              onBlur={e => (e.currentTarget.style.borderColor = border)}
            />
          </div>
        </div>

        {/* Network Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {filtered.map((post, idx) => {
              const isMe = post.user_id === user.id
              const myReq = requests.find(r => r.post_id === post.id)
              const accepted = requests.find(r => r.status === 'accepted' && (r.to_user_id === post.user_id || r.from_user_id === post.user_id))
              const postReferrals = requests.filter(r => r.post_id === post.id && r.status === 'accepted').length
              const name = post.profiles?.full_name || 'Anonymous'
              const initials = getInitials(name)
              const avatarGrad = getAvatarColor(name)

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                  style={{
                    background: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 20,
                    padding: 28,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  {/* Verified badge */}
                  {post.verified && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: darkMode ? '#064e3b' : '#ecfdf5',
                      color: primary,
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      <CheckCircle size={12} /> Verified
                    </div>
                  )}

                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: avatarGrad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 800, color: '#fff',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 16, color: text, lineHeight: 1.3 }}>{name}</p>
                      <p style={{ fontSize: 13, color: muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={12} /> {post.role}
                      </p>
                    </div>
                  </div>

                  {/* Company */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Building2 size={14} color={muted} />
                    <span style={{ fontSize: 13, color: muted }}>{post.company}</span>
                  </div>

                  {/* Bio */}
                  {post.bio && (
                    <p style={{ fontSize: 13, color: muted, marginBottom: 16, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.bio}
                    </p>
                  )}

                  {/* Meta tags */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {post.profiles?.job_title && (
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        background: darkMode ? '#1e293b' : '#f3f4f6',
                        color: muted, padding: '4px 10px', borderRadius: 8,
                      }}>
                        {post.profiles.job_title}
                      </span>
                    )}
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        background: darkMode ? '#1e293b' : '#f3f4f6',
                        color: muted, padding: '4px 10px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Star size={10} /> {postReferrals} referrals
                      </span>
                  </div>

                  {/* Action Button */}
                  {isMe ? (
                    <div style={{
                      fontSize: 13, color: muted, textAlign: 'center', padding: '12px 0',
                      background: darkMode ? '#1e293b' : '#f9fafb', borderRadius: 10,
                      fontWeight: 500,
                    }}>
                      This is your post
                    </div>
                  ) : accepted ? (
                    <Link
                      href={`/network/chat/${post.user_id}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: primary, color: '#fff', padding: '12px',
                        borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <MessageCircle size={16} /> Open chat <ChevronRight size={16} />
                    </Link>
                  ) : myReq ? (
                    <div style={{
                      fontSize: 13, color: muted,
                      background: myReq.status === 'pending' ? (darkMode ? '#422006' : '#fef3c7') : (darkMode ? '#1e293b' : '#f3f4f6'),
                      padding: '12px', borderRadius: 12, display: 'block', textAlign: 'center',
                      fontWeight: 500,
                      border: myReq.status === 'pending' ? `1px solid ${darkMode ? '#92400e' : '#fcd34d'}` : `1px solid ${border}`,
                    }}>
                      {myReq.status === 'pending' ? '⏳ Request pending' : '❌ Declined'}
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendRequest(post)}
                      style={{
                        width: '100%',
                        background: darkMode ? 'transparent' : 'transparent',
                        border: `2px solid ${primary}`,
                        color: primary,
                        borderRadius: 12,
                        padding: '12px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = primary
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = primary
                      }}
                    >
                      <Users size={16} /> Connect
                    </motion.button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        <AnimatePresence>
          {filtered.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: muted,
              }}
            >
              {/* Animated SVG illustration */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginBottom: 24, display: 'inline-block' }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="58" stroke={border} strokeWidth="2" strokeDasharray="6 6" />
                  <circle cx="40" cy="50" r="14" fill={darkMode ? '#334155' : '#e5e7eb'} />
                  <circle cx="80" cy="50" r="14" fill={darkMode ? '#334155' : '#e5e7eb'} />
                  <path d="M30 85 C30 70 50 65 60 72 C70 65 90 70 90 85" stroke={primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <circle cx="40" cy="50" r="5" fill={primary} />
                  <circle cx="80" cy="50" r="5" fill={primary} />
                  <motion.circle
                    cx="60" cy="95" r="4"
                    fill={primary}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </svg>
              </motion.div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 8 }}>
                No referrers yet
              </h3>
              <p style={{ fontSize: 14, color: muted, marginBottom: 24 }}>
                Be the first to join the network!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() => { setPostForm(myPost || { company:'', role:'', bio:'', is_referrer:true }); setShowPostForm(true) }}
                style={{
                  background: primary, color: '#fff', border: 'none',
                  borderRadius: 12, padding: '14px 32px', fontSize: 15,
                  fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(26,122,74,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                <Plus size={18} /> Join Network
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Network Modal */}
        <AnimatePresence>
          {showPostForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                zIndex: 100, padding: 20,
              }}
              onClick={() => setShowPostForm(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: cardBg,
                  borderRadius: '24px 24px 0 0',
                  padding: '32px 28px 36px',
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '85vh',
                  overflowY: 'auto',
                }}
              >
                {/* Drag handle */}
                <div style={{ width: 40, height: 4, borderRadius: 2, background: border, margin: '0 auto 20px' }} />

                <h3 style={{ fontSize: 20, fontWeight: 800, color: text, marginBottom: 4 }}>
                  {myPost ? 'Edit your profile' : 'Join referral network'}
                </h3>
                <p style={{ fontSize: 13, color: muted, marginBottom: 28 }}>
                  Tell others what you can help with
                </p>

                {/* Floating label fields */}
                {[
                  { key: 'company', label: 'Company', placeholder: 'Google, Amazon...', icon: <Building2 size={16} /> },
                  { key: 'role', label: 'Role', placeholder: 'SDE-2, PM, Designer...', icon: <Briefcase size={16} /> },
                  { key: 'bio', label: 'Bio (optional)', placeholder: 'I can refer for SDE roles...', icon: null },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {f.label}
                    </label>
                    <div style={{ position: 'relative' }}>
                      {f.icon && (
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted, display: 'flex' }}>
                          {f.icon}
                        </span>
                      )}
                      <input
                        value={(postForm as any)[f.key]}
                        onChange={e => setPostForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%',
                          padding: f.icon ? '14px 14px 14px 42px' : '14px',
                          border: `1px solid ${border}`,
                          borderRadius: 12,
                          fontSize: 14,
                          background: darkMode ? '#0f172a' : '#f9fafb',
                          color: text,
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = primary
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.1)'
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = border
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px',
                  background: darkMode ? '#0f172a' : '#f9fafb',
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  marginBottom: 28,
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: text }}>I'm currently referring</p>
                    <p style={{ fontSize: 12, color: muted, marginTop: 2 }}>Show you're open to giving referrals</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPostForm(p => ({ ...p, is_referrer: !p.is_referrer }))}
                    style={{
                      width: 52, height: 28, borderRadius: 14,
                      background: postForm.is_referrer ? primary : darkMode ? '#334155' : '#d1d5db',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <motion.div
                      animate={{ x: postForm.is_referrer ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute', top: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    />
                  </motion.button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPostForm(false)}
                    style={{
                      flex: 1, padding: '14px',
                      border: `1px solid ${border}`, borderRadius: 12,
                      cursor: 'pointer', background: 'none', color: text,
                      fontSize: 14, fontWeight: 500,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={savePost}
                    style={{
                      flex: 2, padding: '14px',
                      background: primary, color: '#fff',
                      border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700,
                      fontSize: 14,
                      boxShadow: '0 4px 16px rgba(26,122,74,0.3)',
                    }}
                  >
                    {myPost ? 'Update Profile' : 'Join Network'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
