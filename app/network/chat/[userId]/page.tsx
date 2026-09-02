'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Send, Paperclip, Smile, Phone, Video, MoreVertical, 
  Check, CheckCheck, Image as ImageIcon, File, X, Download,
  Camera, ChevronLeft, Mic
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾']

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const GIPHY_API_KEY = 'gMKOeN93Y4VZ7Hg0RZr5pJP3XsT5O5Qg'

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: string | Date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
  if (type === 'application/pdf') return <File className="w-5 h-5 text-red-500" />
  return <File className="w-5 h-5" />
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifQuery, setGifQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [gifLoading, setGifLoading] = useState(false)
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null)
  const [reactionPosition, setReactionPosition] = useState({ x: 0, y: 0 })
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { userId } = useParams()
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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

      await supabase.from('messages').update({ read: true }).eq('to_id', user.id).eq('from_id', userId)
    }
    load()

    const typingChannel = supabase.channel('typing')
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState()
        const typing = new Set<string>()
        Object.keys(state).forEach(key => {
          state[key].forEach((presence: any) => {
            if (presence.user_id !== user?.id && presence.typing) {
              typing.add(presence.user_id)
            }
          })
        })
        setTypingUsers(typing)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: any) => {
          if (p.user_id !== user?.id && p.typing) {
            setTypingUsers(prev => new Set([...prev, p.user_id]))
          }
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: any) => {
          setTypingUsers(prev => {
            const next = new Set(prev)
            next.delete(p.user_id)
            return next
          })
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await typingChannel.track({ user_id: user?.id, typing: false })
        }
      })

    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any
        if ((msg.from_id === userId || msg.to_id === userId) && msg.from_id !== user?.id) {
          setMessages(prev => [...prev, msg])
          scrollToBottom()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [userId, user, supabase, router, scrollToBottom])

  const handleTyping = useCallback(async (isTyping: boolean) => {
    const typingChannel = supabase.channel('typing')
    await typingChannel.track({ user_id: user?.id, typing: isTyping })
  }, [user, supabase])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (input.trim()) {
      handleTyping(true)
      timeout = setTimeout(() => handleTyping(false), 2000)
    } else {
      handleTyping(false)
    }
    return () => clearTimeout(timeout)
  }, [input, handleTyping])

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      setShowScrollFab(scrollHeight - scrollTop - clientHeight > 100)
    }
  }, [])

  const startLongPress = (e: React.MouseEvent | React.TouchEvent, messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      setReactionPosition({ x: rect.left + rect.width / 2, y: rect.top - 50 })
      setShowReactionsFor(messageId)
    }, 500)
  }

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return
    const reactions = msg.reactions || {}
    const userReactions = reactions[emoji] || []
    if (userReactions.includes(user?.id)) {
      reactions[emoji] = userReactions.filter((id: string) => id !== user?.id)
    } else {
      reactions[emoji] = [...userReactions, user?.id]
    }
    if (reactions[emoji].length === 0) delete reactions[emoji]
    await supabase.from('messages').update({ reactions }).eq('id', messageId)
    setShowReactionsFor(null)
  }

  const sendMessage = async () => {
    if (!input.trim() && !previewFile) return
    if (!user) return

    let fileUrl = null
    let fileName = null
    let fileType = null
    let fileSize = null

    if (previewFile) {
      const timestamp = Date.now()
      const path = `chats/${userId}/${timestamp}-${previewFile.name}`
      const { data, error } = await supabase.storage.from('chat-files').upload(path, previewFile, {
        upsert: false,
      })
      if (error) {
        console.error('Upload error:', error)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(data.path)
      fileUrl = publicUrl
      fileName = previewFile.name
      fileType = previewFile.type
      fileSize = previewFile.size
      setPreviewFile(null)
      setUploadProgress({})
    }

    const msg = { 
      from_id: user.id, 
      to_id: userId, 
      content: input.trim(), 
      read: false,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      reactions: {}
    }
    setInput('')
    setShowEmojiPicker(false)
    setShowGifPicker(false)
    await supabase.from('messages').insert(msg)
    handleTyping(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB)')
        return
      }
      setPreviewFile(file)
    }
  }

  const removePreviewFile = () => {
    setPreviewFile(null)
  }

  const searchGifs = async (query: string) => {
    if (!query.trim()) return
    setGifLoading(true)
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`)
      const data = await res.json()
      setGifs(data.data || [])
    } catch (err) {
      console.error('GIF search error:', err)
    }
    setGifLoading(false)
  }

  const sendGif = async (gifUrl: string) => {
    if (!user) return
    const msg = { 
      from_id: user.id, 
      to_id: userId, 
      content: '', 
      read: false,
      file_url: gifUrl,
      file_name: 'gif',
      file_type: 'image/gif',
      file_size: 0,
      reactions: {}
    }
    await supabase.from('messages').insert(msg)
    setShowGifPicker(false)
    setGifQuery('')
    setGifs([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getMessageStyle = (isMe: boolean, showTail: boolean) => ({
    maxWidth: '72%',
    background: isMe ? 'linear-gradient(135deg, #1a7a4a 0%, #22c55e 100%)' : '#ffffff',
    color: isMe ? '#fff' : '#1a1a1a',
    padding: '10px 16px',
    borderRadius: isMe 
      ? (showTail ? '20px 20px 4px 20px' : '20px 20px 20px 20px')
      : (showTail ? '20px 20px 20px 4px' : '20px 20px 20px 20px'),
    border: isMe ? 'none' : '1px solid #e5e7eb',
    fontSize: 14,
    lineHeight: 1.5,
    boxShadow: isMe ? '0 2px 8px rgba(26, 122, 74, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1a7a4a] border-t-transparent" />
      </div>
    )
  }

  const isDark = false

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0f172a]' : 'bg-[#f0fdf4]'}`} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-[#0f172a]/80 border-b border-[#e5e7eb] dark:border-[#1e293b]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/network" className="text-[#1a7a4a] text-2xl font-light leading-none hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a7a4a] to-[#22c55e] flex items-center justify-center text-white font-bold text-lg">
              {getInitials(otherUser?.full_name || 'U')}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0f172a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#1a1a1a] dark:text-white truncate">{otherUser?.full_name || 'User'}</p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-[#e5e7eb] dark:hover:bg-[#1e293b] transition-colors" aria-label="Video call">
              <Video className="w-5 h-5 text-[#1a1a1a] dark:text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-[#e5e7eb] dark:hover:bg-[#1e293b] transition-colors" aria-label="Voice call">
              <Phone className="w-5 h-5 text-[#1a1a1a] dark:text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-[#e5e7eb] dark:hover:bg-[#1e293b] transition-colors" aria-label="More options">
              <MoreVertical className="w-5 h-5 text-[#1a1a1a] dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const isMe = msg.from_id === user?.id
            const prevMsg = messages[index - 1]
            const nextMsg = messages[index + 1]
            const showAvatar = !prevMsg || prevMsg.from_id !== msg.from_id
            const showTail = !nextMsg || nextMsg.from_id !== msg.from_id
            const showDate = !prevMsg || formatDate(prevMsg.created_at) !== formatDate(msg.created_at)

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[85%] ${showAvatar ? '' : 'items-end'}`}>
                  {!isMe && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a7a4a] to-[#22c55e] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {getInitials(otherUser?.full_name || 'U')}
                    </div>
                  )}
                  {isMe && showAvatar && <div className="w-8 flex-shrink-0" />}
                  
                  <div className="flex flex-col gap-1">
                    {showDate && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center -my-2"
                      >
                        <span className="px-3 py-1 text-xs text-[#888] dark:text-[#64748b] bg-white/80 dark:bg-[#1e293b]/80 rounded-full backdrop-blur-sm border border-[#e5e7eb] dark:border-[#334155]">
                          {formatDate(msg.created_at)}
                        </span>
                      </motion.div>
                    )}
                    
                    <div 
                      className="relative group"
                      onMouseDown={(e) => startLongPress(e, msg.id)}
                      onMouseUp={endLongPress}
                      onMouseLeave={endLongPress}
                      onTouchStart={(e) => startLongPress(e, msg.id)}
                      onTouchEnd={endLongPress}
                    >
                      <div
                        style={getMessageStyle(isMe, showTail)}
                        className="relative min-w-[50px]"
                      >
                        {/* File/Image preview */}
                        {msg.file_url && (
                          <div className="mb-1">
                            {msg.file_type?.startsWith('image/') ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name || 'Image'}
                                onClick={() => setExpandedImage(msg.file_url)}
                                className="rounded-[12px] max-w-[240px] cursor-zoom-in"
                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="flex items-center gap-3 p-2 bg-white/10 dark:bg-white/5 rounded-[12px] min-w-[200px]">
                                <div className="flex-shrink-0 text-2xl">
                                  {msg.file_type === 'application/pdf' ? '📄' : '📎'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.file_name}</p>
                                  <p className="text-xs opacity-70">{msg.file_size ? formatFileSize(msg.file_size) : ''}</p>
                                </div>
                                <a
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.file_name}
                                  className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Text content */}
                        {msg.content && (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {/* Upload progress */}
                        {msg.file_name && uploadProgress[msg.file_name] !== undefined && (
                          <div className="mt-2 h-1 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white transition-all duration-300" 
                              style={{ width: `${uploadProgress[msg.file_name]}%` }}
                            />
                          </div>
                        )}

                        {/* Time and read status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
                          {isMe && (
                            <CheckCheck 
                              className={`w-3.5 h-3.5 ${msg.read_at ? 'text-green-300' : 'text-white/50'}`}
                              strokeWidth={3}
                            />
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
                              <span
                                key={emoji}
                                className="px-1.5 py-0.5 text-xs bg-white/20 dark:bg-white/10 rounded-full cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => addReaction(msg.id, emoji)}
                              >
                                {emoji} <span className="text-[10px]">{users.length}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reaction picker */}
                      <AnimatePresence>
                        {showReactionsFor === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 px-2 py-1.5 bg-white dark:bg-[#1e293b] rounded-full shadow-lg border border-[#e5e7eb] dark:border-[#334155] z-30"
                            style={{ transformOrigin: 'center bottom' }}
                          >
                            {QUICK_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(msg.id, emoji)}
                                className="text-xl p-1 hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="px-4 pb-2"
        >
          <div className="flex items-center gap-2 text-sm text-[#888] dark:text-[#64748b] max-w-[72%]">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{otherUser?.full_name || 'Someone'} is typing...</span>
          </div>
        </motion.div>
      )}

      {/* Expanded image modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <img
              src={expandedImage}
              alt="Expanded"
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollFab && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 right-4 z-20 w-11 h-11 rounded-full bg-[#1a7a4a] text-white shadow-lg flex items-center justify-center hover:bg-[#16653e] transition-colors"
            aria-label="Scroll to bottom"
          >
            <ChevronLeft className="w-5 h-5 rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-t border-[#e5e7eb] dark:border-[#1e293b] p-4">
        {/* File preview */}
        {previewFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 mb-3 p-3 bg-[#f0fdf4] dark:bg-[#1e293b] rounded-xl border border-[#e5e7eb] dark:border-[#334155]"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a7a4a] to-[#22c55e] flex items-center justify-center text-white">
              {getFileIcon(previewFile.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{previewFile.name}</p>
              <p className="text-xs text-[#888] dark:text-[#64748b]">{formatFileSize(previewFile.size)}</p>
            </div>
            <button
              onClick={removePreviewFile}
              className="p-2 text-[#888] hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-3 p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-[#e5e7eb] dark:border-[#334155] shadow-lg"
            >
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => { setShowEmojiPicker(true); setShowGifPicker(false); }}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${!showGifPicker ? 'bg-[#1a7a4a] text-white' : 'bg-[#e5e7eb] dark:bg-[#334155] text-[#1a1a1a] dark:text-white'}`}
                >
                  Emoji
                </button>
                <button
                  onClick={() => { setShowGifPicker(true); setShowEmojiPicker(true); }}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${showGifPicker ? 'bg-[#1a7a4a] text-white' : 'bg-[#e5e7eb] dark:bg-[#334155] text-[#1a1a1a] dark:text-white'}`}
                >
                  GIF
                </button>
              </div>
              
              {showGifPicker ? (
                <div className="max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    value={gifQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGifQuery(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') searchGifs(gifQuery) }}
                    placeholder="Search GIFs..."
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] dark:border-[#334155] rounded-lg bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]"
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {gifLoading ? (
                      <div className="col-span-4 flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1a7a4a] border-t-transparent" />
                      </div>
                    ) : gifs.map((gif: any) => (
                      <button
                        key={gif.id}
                        onClick={() => sendGif(gif.images.fixed_width.url)}
                        className="aspect-square rounded-lg overflow-hidden relative"
                      >
                        <img
                          src={gif.images.fixed_width.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInput(prev => prev + emoji)
                        inputRef.current?.focus()
                      }}
                      className="text-xl p-1 hover:bg-[#f0fdf4] dark:hover:bg-[#1e293b] rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2">
          <label className="p-2.5 rounded-full hover:bg-[#e5e7eb] dark:hover:bg-[#1e293b] transition-colors cursor-pointer" htmlFor="file-input">
            <Paperclip className="w-5 h-5 text-[#888] dark:text-[#64748b]" />
            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-full hover:bg-[#e5e7eb] dark:hover:bg-[#1e293b] transition-colors"
            aria-label="Emoji picker"
          >
            <Smile className="w-5 h-5 text-[#888] dark:text-[#64748b]" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 bg-[#f0fdf4] dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-[24px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:border-transparent"
              style={{ minHeight: '48px', maxHeight: '150px' }}
              rows={1}
            />
          </div>

          {input.trim() || previewFile ? (
            <motion.button
              onClick={sendMessage}
              disabled={!input.trim() && !previewFile}
              whileTap={{ scale: 0.9 }}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1a7a4a] to-[#22c55e] text-white flex items-center justify-center shadow-lg hover:from-[#16653e] hover:to-[#1a7a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          ) : (
            <button
              className="w-11 h-11 rounded-full bg-[#e5e7eb] dark:bg-[#334155] text-[#888] dark:text-[#64748b] flex items-center justify-center hover:bg-[#d1d5db] dark:hover:bg-[#475569] transition-colors"
              aria-label="Camera"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}