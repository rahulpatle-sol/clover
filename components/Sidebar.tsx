'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/jobs', icon: '🔍', label: 'Find jobs' },
  { href: '/resume', icon: '📄', label: 'Resume' },
  { href: '/network', icon: '🤝', label: 'Network' },
  { href: '/profile', icon: '👤', label: 'Profile' },
  { href: '/admin', icon: '👑', label: 'Admin', adminOnly: true },
]

export default function Sidebar({ userName, isAdmin }: { userName: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const visibleLinks = links.filter(l => !l.adminOnly || isAdmin)

  return (
    <aside style={{ width:220, minHeight:'100vh', background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh' }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:28, padding:'0 8px' }}>
        <span style={{ fontSize:20 }}>🍀</span>
        <span style={{ fontSize:16, fontWeight:700, color:'#1a1a1a' }}>Clover</span>
      </Link>

      <nav style={{ flex:1 }}>
        {visibleLinks.map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          return (
            <Link key={l.href} href={l.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, textDecoration:'none', marginBottom:2, fontSize:14, background: active?'#e8f5ee':'transparent', color: active?'#1a7a4a':'#555', fontWeight: active?500:400 }}>
              <span>{l.icon}</span>{l.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:4 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#1a7a4a' }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize:13, color:'#333', fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</span>
        </div>
        <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#dc2626' }}>
          🚪 Sign out
        </button>
      </div>
    </aside>
  )
}
