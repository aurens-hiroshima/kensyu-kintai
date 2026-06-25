'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Request = {
  id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  created_at: string
  user_id: string
  profiles: { full_name: string | null } | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '申請中',  color: 'bg-orange-100 text-orange-700' },
  approved: { label: '承認済',  color: 'bg-green-100 text-green-700' },
  rejected: { label: '否認',    color: 'bg-red-100 text-red-700' },
  returned: { label: '差戻し',  color: 'bg-gray-100 text-gray-600' },
}

export default function ApprovePage() {
  const supabase = createClient()
  const [requests, setRequests]   = useState<Request[]>([])
  const [filter, setFilter]       = useState<'pending' | 'all'>('pending')
  const [comment, setComment]     = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState<string | null>(null)
  const [message, setMessage]     = useState('')

  const fetchRequests = async () => {
    const query = supabase
      .from('leave_requests')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    const { data } = filter === 'pending'
      ? await query.eq('status', 'pending')
      : await query

    setRequests(data ?? [])
  }

  useEffect(() => { fetchRequests() }, [filter])

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'returned') => {
    setLoading(id)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        reviewer_comment: comment[id] || null,
      })
      .eq('id', id)

    if (error) {
      setMessage('更新に失敗しました: ' + error.message)
    } else {
      setMessage(status === 'approved' ? '承認しました' : status === 'rejected' ? '否認しました' : '差戻しました')
      await fetchRequests()
    }
    setLoading(null)
  }

  const pending = requests.filter(r => r.status === 'pending').length

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <h1 className="text-base font-bold text-gray-800 flex-1">申請・承認</h1>
        {pending > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
            未処理 {pending}件
          </span>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex gap-2 mb-5">
          <button onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >申請中のみ</button>
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >すべて</button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {requests.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">
              {filter === 'pending' ? '未処理の申請はありません' : '申請データがありません'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map(r => {
                const s = STATUS_LABEL[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                const days = Math.max(1, (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000 + 1)
                return (
                  <div key={r.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-800">
                            {r.profiles?.full_name ?? '（名前未設定）'}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-0.5">{r.type}　<span className="text-gray-500">{r.start_date} 〜 {r.end_date}（{days}日）</span></div>
                        {r.reason && <div className="text-xs text-gray-400 mt-1">理由：{r.reason}</div>}
                        <div className="text-xs text-gray-300 mt-1">{new Date(r.created_at).toLocaleString('ja-JP')}</div>
                      </div>

                      {r.status === 'pending' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <input
                            placeholder="コメント（任意）"
                            value={comment[r.id] ?? ''}
                            onChange={e => setComment(prev => ({ ...prev, [r.id]: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-48 focus:outline-none focus:border-blue-400"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={() => handleAction(r.id, 'approved')} disabled={loading === r.id}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">
                              承認
                            </button>
                            <button onClick={() => handleAction(r.id, 'returned')} disabled={loading === r.id}
                              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">
                              差戻
                            </button>
                            <button onClick={() => handleAction(r.id, 'rejected')} disabled={loading === r.id}
                              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">
                              否認
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
