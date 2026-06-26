'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  full_name: string | null
  department: string | null
  role: string | null
}

type Tab = 'profile' | 'company' | 'users'

export default function SettingsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // フォーム値
  const [fullName, setFullName]     = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving]         = useState(false)
  const [message, setMessage]       = useState('')

  // ユーザー一覧
  const [users, setUsers] = useState<Profile[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, department, role')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setDepartment(data.department ?? '')
        setIsAdmin(data.role === 'admin' || data.role === 'manager')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (tab === 'users' && isAdmin) {
      supabase.from('profiles').select('id, full_name, department, role').then(({ data }) => {
        setUsers(data ?? [])
      })
    }
  }, [tab, isAdmin])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, department })
      .eq('id', profile?.id ?? '')
    setMessage(error ? '保存に失敗しました: ' + error.message : '保存しました')
    setSaving(false)
  }

  const handleRoleChange = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  const TABS: { key: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'プロフィール', icon: '👤' },
    { key: 'company', label: '会社・勤務設定', icon: '🏢', adminOnly: true },
    { key: 'users',   label: 'ユーザー管理',  icon: '👥', adminOnly: true },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <h1 className="text-base font-bold text-gray-800">設定</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドタブ */}
        <div className="w-52 bg-gray-50 border-r border-gray-200 py-4 flex-shrink-0">
          {TABS.map(t => {
            if (t.adminOnly && !isAdmin) return null
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setMessage('') }}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm border-l-2 transition-all text-left
                  ${active
                    ? 'bg-blue-50 text-blue-700 border-blue-500 font-semibold'
                    : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'
                  }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ─── プロフィール ─── */}
          {tab === 'profile' && (
            <div className="max-w-lg">
              <h2 className="text-base font-bold text-gray-800 mb-6">プロフィール設定</h2>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">氏名</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">部署</label>
                  <input
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="営業部"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">ロール</label>
                  <div className="px-3 py-2.5 border-2 border-gray-100 rounded-lg text-sm text-gray-400 bg-gray-50">
                    {profile?.role === 'admin' ? '管理者' : profile?.role === 'manager' ? 'マネージャー' : '一般社員'}
                    <span className="text-xs ml-2">（管理者のみ変更可）</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">パスワード変更</label>
                  <button
                    type="button"
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user?.email) {
                        await supabase.auth.resetPasswordForEmail(user.email)
                        setMessage('パスワード変更メールを送信しました')
                      }
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    パスワード変更メールを送る
                  </button>
                </div>

                {message && (
                  <div className={`text-sm px-3 py-2.5 rounded-lg ${message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
              </form>
            </div>
          )}

          {/* ─── 会社・勤務設定 ─── */}
          {tab === 'company' && (
            <div className="max-w-lg">
              <h2 className="text-base font-bold text-gray-800 mb-6">会社・勤務設定</h2>
              <div className="space-y-5">
                {[
                  { label: '会社名',         value: '株式会社オーレンス', type: 'text' },
                  { label: '所定労働時間',    value: '8', suffix: '時間 / 日', type: 'number' },
                  { label: '休憩時間',        value: '60', suffix: '分', type: 'number' },
                  { label: '36協定 月上限',   value: '45', suffix: '時間 / 月', type: 'number' },
                  { label: '36協定 年上限',   value: '360', suffix: '時間 / 年', type: 'number' },
                  { label: '時間外割増率',    value: '25', suffix: '%', type: 'number' },
                  { label: '深夜割増率',      value: '25', suffix: '%', type: 'number' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={f.type}
                        defaultValue={f.value}
                        className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                      {f.suffix && <span className="text-sm text-gray-500 whitespace-nowrap">{f.suffix}</span>}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-xs text-gray-400 mb-3">※ 実装予定：保存するとDB反映されます</p>
                  <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
                    保存する
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── ユーザー管理 ─── */}
          {tab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-gray-800">ユーザー管理</h2>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  ＋ ユーザー招待
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs text-gray-400 font-semibold px-5 py-3">氏名</th>
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">部署</th>
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">ロール</th>
                      <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-10 text-sm">ユーザーデータなし</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{u.full_name ?? '（未設定）'}</td>
                        <td className="px-4 py-3 text-gray-500">{u.department ?? '未設定'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role ?? 'employee'}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400"
                          >
                            <option value="employee">一般社員</option>
                            <option value="manager">マネージャー</option>
                            <option value="admin">管理者</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-red-400 hover:text-red-600 transition-colors">
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">※ 削除・招待は今後実装予定です</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
