'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Target,
  User,
  Settings,
  LogOut,
  Clover,
  ChevronRight
} from 'lucide-react'

const links = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Find Jobs' },
  { href: '/resume', icon: FileText, label: 'Resume' },
  { href: '/interview-prep', icon: Target, label: 'Interview Prep' },
  { href: '/network', icon: Users, label: 'Network' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/admin', icon: Settings, label: 'Admin', adminOnly: true },
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
    <aside style={{
      width: 260,
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #eef0f2',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      boxShadow: '4px 0 24px -8px rgba(0, 0, 0, 0.03)',
    }}>
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          marginBottom: 32,
          padding: '0 8px',
        }}
      >
        <Clover
          size={28}
          style={{
            color: '#1a7a4a',
            filter: 'drop-shadow(0 2px 4px rgba(26, 122, 74, 0.2))',
          }}
        />
        <span style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.02em',
        }}>
          Clover
        </span>
      </Link>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visibleLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          const Icon = l.icon
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: active ? 600 : 500,
                background: active ? '#f0fdf4' : 'transparent',
                color: active ? '#15803d' : '#475569',
                border: active ? '1px solid #dcfce7' : 'none',
                boxShadow: active ? '0 2px 8px -2px rgba(26, 122, 74, 0.15)' : 'none',
                transition: 'all 0.18s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.color = '#1e293b'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#475569'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: active ? '#dcfce7' : 'transparent',
                color: active ? '#15803d' : '#94a3b8',
                transition: 'all 0.18s ease',
              }}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {l.label}
              </span>
              {active && (
                <ChevronRight
                  size={16}
                  style={{
                    color: '#15803d',
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{
        borderTop: '1px solid #eef0f2',
        paddingTop: 20,
        marginTop: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          marginBottom: 8,
          borderRadius: 12,
          background: '#f8fafc',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a7a4a 0%, #15803d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 2px 8px -2px rgba(26, 122, 74, 0.4)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span style={{
            fontSize: 14,
            color: '#1e293b',
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {userName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 14px',
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: '#dc2626',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2'
            e.currentTarget.style.borderColor = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#fecaca'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#dc2626',
          }}>
            <LogOut size={16} strokeWidth={2.2} />
          </div>
          <span style={{ flex: 1 }}>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
