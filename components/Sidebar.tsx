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
  ChevronRight,
  Mail,
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

const sidebarWidth = 240

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
      width: sidebarWidth,
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      boxShadow: '4px 0 24px -8px rgba(0, 0, 0, 0.08)',
    }}>
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          marginBottom: 32,
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
          fontSize: 17,
          fontWeight: 700,
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
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                background: active ? '#e8f5ee' : 'transparent',
                color: active ? '#1a7a4a' : '#64748b',
                border: active ? '1px solid #1a7a4a' : 'none',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.color = '#1e293b'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                background: active ? '#dcfce7' : 'transparent',
                color: active ? '#1a7a4a' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {l.label}
              </span>
              {active && (
                <ChevronRight
                  size={14}
                  style={{
                    color: '#1a7a4a',
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
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20,
        marginTop: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          marginBottom: 8,
          borderRadius: 10,
          background: '#f8fafc',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a7a4a 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 2px 8px -2px rgba(26, 122, 74, 0.4)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span style={{
            fontSize: 13,
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
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#dc2626',
            transition: 'all 0.15s ease',
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#dc2626',
          }}>
            <LogOut size={15} strokeWidth={2.2} />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}