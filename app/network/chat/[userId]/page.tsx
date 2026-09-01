'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { userId } = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: other } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setOtherUser(other)
      const { data: msgs } = await supabase.from('messages')
        .select('*')
        .or(`and(from_id.eq.${user.id},to_id.eq.${userId}),and(from_id.eq.${userId},to_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(msgs || [])
      setLoading(false)

      // Mark as read
      await supabase.from('messages').update({ read: true }).eq('to_id', user.id).eq('from_id', userId)
    }
    load()

    // Realtime subscription
    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any
        if ((msg.from_id === userId || msg.to_id === userId)) {
          setMessages(prev => [...prev, msg])
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !user) return
    const msg = { from_id: user.id, to_id: userId, content: input.trim(), read: false }
    setInput('')
    await supabase.from('messages').insert(msg)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#f9fafb' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 20px', display:'flex', alignItems:'center', gap:14, position:'sticky', top:0 }}>
        <Link href="/network" style={{ color:'#1a7a4a', textDecoration:'none', fontSize:20 }}>←</Link>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#1a7a4a' }}>
          {(otherUser?.full_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight:600, fontSize:15, color:'#1a1a1a' }}>{otherUser?.full_name || 'User'}</p>
          <p style={{ fontSize:12, color:'#888' }}>{otherUser?.job_title || ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? <p style={{ textAlign:'center', color:'#888' }}>Loading...</p> : messages.length === 0 ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <p style={{ fontSize:36, marginBottom:10 }}>💬</p>
            <p style={{ color:'#888', fontSize:14 }}>Start the conversation! Share your resume or ask about the referral process.</p>
          </div>
        ) : messages.map(msg => {
          const isMe = msg.from_id === user?.id
          return (
            <div key={msg.id} style={{ display:'flex', justifyContent: isMe?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'72%', background: isMe?'#1a7a4a':'#fff', color: isMe?'#fff':'#1a1a1a', padding:'10px 16px', borderRadius: isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', border: isMe?'none':'1px solid #e5e7eb', fontSize:14, lineHeight:1.5 }}>
                {msg.content}
                <div style={{ fontSize:11, opacity:0.65, marginTop:4, textAlign:'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background:'#fff', borderTop:'1px solid #e5e7eb', padding:'16px 20px', display:'flex', gap:10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Type a message..."
          style={{ flex:1, padding:'10px 16px', border:'1px solid #e5e7eb', borderRadius:24, fontSize:14, outline:'none' }} />
        <button onClick={sendMessage} style={{ width:44, height:44, background:'#1a7a4a', color:'#fff', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
          ↑
        </button>
      </div>
    </div>
  )
}
