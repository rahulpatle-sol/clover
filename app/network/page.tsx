'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

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
      const { data: reqs } = await supabase.from('referral_requests').select('*, referral_posts(company,role), profiles!referral_requests_from_user_id_fkey(full_name)').eq('to_user_id', user.id)
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
    showToast('Connect request sent! 🤝')
  }

  async function respondRequest(id: string, status: string) {
    await supabase.from('referral_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    showToast(status === 'accepted' ? 'Connection accepted! 🎉' : 'Request declined')
  }

  async function savePost() {
    if (!postForm.company || !postForm.role) { showToast('Fill company and role'); return }
    if (myPost) {
      await supabase.from('referral_posts').update(postForm).eq('id', myPost.id)
      setMyPost({ ...myPost, ...postForm })
    } else {
      const { data } = await supabase.from('referral_posts').insert({ ...postForm, user_id: user.id }).select().single()
      setMyPost(data)
    }
    setShowPostForm(false)
    showToast('Profile updated! ✅')
  }

  const filtered = referrers.filter(r => {
    const q = search.toLowerCase()
    const co = company.toLowerCase()
    return (!q || r.company?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q)) &&
      (!co || r.company?.toLowerCase().includes(co))
  })

  const bg = darkMode ? '#0f172a' : '#f9fafb'
  const cardBg = darkMode ? '#1e293b' : '#fff'
  const border = darkMode ? '#334155' : '#e5e7eb'
  const text = darkMode ? '#f1f5f9' : '#1a1a1a'
  const muted = darkMode ? '#94a3b8' : '#888'

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: bg }}><p style={{ color: muted }}>Loading network...</p></div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: bg }}>
      <Sidebar userName={profile?.full_name || user?.email || 'User'} />
      <main style={{ flex:1, padding:'28px 32px' }}>
        {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1a7a4a', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:500, zIndex:200 }}>{toast}</div>}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color: text }}>Referral network</h1>
            <p style={{ fontSize:13, color: muted, marginTop:2 }}>Connect with people who can refer you</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:16 }}>{darkMode?'☀️':'🌙'}</button>
            <button onClick={() => { setPostForm(myPost || { company:'', role:'', bio:'', is_referrer:true }); setShowPostForm(true) }} style={{ background:'#1a7a4a', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:500, cursor:'pointer' }}>
              {myPost ? '✏️ Edit my post' : '+ Join network'}
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        {requests.filter(r=>r.status==='pending').length > 0 && (
          <div style={{ background: cardBg, border:`1px solid #f59e0b`, borderRadius:12, padding:20, marginBottom:20 }}>
            <h3 style={{ fontSize:15, fontWeight:600, color: text, marginBottom:14 }}>🔔 Pending requests ({requests.filter(r=>r.status==='pending').length})</h3>
            {requests.filter(r=>r.status==='pending').map(r => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${border}` }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:500, color: text }}>{r.profiles?.full_name || 'Someone'}</p>
                  <p style={{ fontSize:12, color: muted }}>Wants referral at {r.referral_posts?.company}</p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => respondRequest(r.id,'accepted')} style={{ background:'#1a7a4a', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13 }}>Accept</button>
                  <button onClick={() => respondRequest(r.id,'rejected')} style={{ background:'none', border:`1px solid #ef4444`, borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13, color:'#ef4444' }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or role..."
            style={{ flex:1, minWidth:200, padding:'10px 14px', border:`1px solid ${border}`, borderRadius:8, fontSize:14, background: cardBg, color: text, outline:'none' }} />
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Filter by company..."
            style={{ width:200, padding:'10px 14px', border:`1px solid ${border}`, borderRadius:8, fontSize:14, background: cardBg, color: text, outline:'none' }} />
        </div>

        {/* Network Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(post => {
            const isMe = post.user_id === user.id
            const myReq = requests.find(r => r.post_id === post.id)
            const accepted = requests.find(r => r.post_id === post.id && r.status === 'accepted')
            return (
              <div key={post.id} style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:16, padding:22, position:'relative' }}>
                {post.verified && <span style={{ position:'absolute', top:14, right:14, fontSize:11, background:'#e8f5ee', color:'#1a7a4a', padding:'2px 8px', borderRadius:10 }}>✅ Verified</span>}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:46, height:46, borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#1a7a4a', flexShrink:0 }}>
                    {(post.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14, color: text }}>{post.profiles?.full_name || 'Anonymous'}</p>
                    <p style={{ fontSize:12, color: muted }}>{post.role} at {post.company}</p>
                  </div>
                </div>
                {post.bio && <p style={{ fontSize:13, color: muted, marginBottom:14, lineHeight:1.5 }}>{post.bio}</p>}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                  <span style={{ fontSize:11, background:'#e8f5ee', color:'#1a7a4a', padding:'3px 10px', borderRadius:10 }}>🏢 {post.company}</span>
                  <span style={{ fontSize:11, background:'#f3f4f6', color:'#555', padding:'3px 10px', borderRadius:10 }}>💼 {post.role}</span>
                </div>
                {isMe ? (
                  <span style={{ fontSize:13, color: muted }}>Your post</span>
                ) : accepted ? (
                  <Link href={`/network/chat/${post.user_id}`} style={{ display:'block', textAlign:'center', background:'#1a7a4a', color:'#fff', padding:'8px', borderRadius:8, fontSize:13, fontWeight:500, textDecoration:'none' }}>
                    💬 Open chat
                  </Link>
                ) : myReq ? (
                  <span style={{ fontSize:13, color: muted, background:'#f3f4f6', padding:'8px 14px', borderRadius:8, display:'block', textAlign:'center' }}>
                    {myReq.status === 'pending' ? '⏳ Request pending' : '❌ Declined'}
                  </span>
                ) : (
                  <button onClick={() => sendRequest(post)} style={{ width:'100%', background:'none', border:`1px solid #1a7a4a`, color:'#1a7a4a', borderRadius:8, padding:'8px', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                    🤝 Connect
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color: muted }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🤝</div>
              <p>No referrers found. Be the first to join!</p>
            </div>
          )}
        </div>

        {/* Post Form Modal */}
        {showPostForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div style={{ background: cardBg, borderRadius:16, padding:28, width:'100%', maxWidth:480 }}>
              <h3 style={{ fontSize:17, fontWeight:700, color: text, marginBottom:20 }}>Join referral network</h3>
              {[
                { key:'company', label:'Your company', placeholder:'Google, Amazon...' },
                { key:'role', label:'Your role', placeholder:'SDE-2, PM, Designer...' },
                { key:'bio', label:'Short bio (optional)', placeholder:'I can refer for SDE roles in my team...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:13, fontWeight:500, color: text, display:'block', marginBottom:6 }}>{f.label}</label>
                  <input value={(postForm as any)[f.key]} onChange={e => setPostForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    style={{ width:'100%', padding:'10px 14px', border:`1px solid ${border}`, borderRadius:8, fontSize:14, background: darkMode?'#0f172a':cardBg, color: text, outline:'none' }} />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button onClick={() => setShowPostForm(false)} style={{ padding:'9px 18px', border:`1px solid ${border}`, borderRadius:8, cursor:'pointer', background:'none', color: text }}>Cancel</button>
                <button onClick={savePost} style={{ padding:'9px 20px', background:'#1a7a4a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
