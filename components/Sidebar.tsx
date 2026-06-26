'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/stamp',     label: '打刻',           icon: '🕐' },
  { href: '/kintai',   label: '勤怠一覧',        icon: '📋' },
  { href: '/shift',    label: 'シフト管理',       icon: '📅' },
  { href: '/leave',    label: '休暇申請',         icon: '🌴' },
  { href: '/approve',  label: '申請・承認',       icon: '✅' },
  { href: '/admin',    label: '管理者画面',       icon: '📊' },
  { href: '/settings', label: '設定',             icon: '⚙️' },
]

type Props = {
  userName: string
  department?: string
}

export default function Sidebar({ userName, department }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName.charAt(0)

  return (
    <aside className="w-56 bg-gray-900 flex flex-col flex-shrink-0 min-h-screen">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-white font-bold text-sm">オーレンス勤怠</div>
        <div className="text-blue-300 text-xs mt-0.5">Employee Portal</div>
      </div>

      {/* ナビ */}
      <nav className="flex-1 py-2">
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-sm border-l-2 transition-all
                ${active
                  ? 'bg-blue-900/40 text-blue-300 border-blue-500'
                  : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-gray-200 text-xs font-medium">{userName}</div>
            {department && (
              <div className="text-gray-500 text-xs">{department}</div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
        >
          ログアウト →
        </button>
      </div>
    </aside>
  )
}
