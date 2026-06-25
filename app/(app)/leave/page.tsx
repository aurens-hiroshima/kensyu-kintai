'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LeaveRequest = {
  id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  created_at: string
  reviewer_comment: string | null
}

const LEAVE_TYPES = [
  '有給休暇', '半日休暇（午前）', '半日休暇（午後）',
  '時間休暇', '特別休暇', '代休',
]

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '申請中',  color: 'bg-orange-100 text-orange-700' },
  approved: { label: '承認済',  color: 'bg-green-100 text-green-700' },
  rejected: { label: '否認',    color: 'bg-red-100 text-red-700' },
  returned: { label: '差戻し',  color: 'bg-gray-100 text-gray-600' },
}

export default function LeavePage() {
  const supabase = createClient()

  const [type, setType]           = useState(LEAVE_TYPES[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [reason, setReason]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage]     = useState('')
  const [requests, setRequests]   = useState<LeaveRequest[]>([])

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  useEffect(() => { fetchRequests() }, [])

  const calcDays = () => {
    if (!startDate || !endDate) return 0
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    return Math.max(0, diff + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) { setMessage('開始日・終了日を入力してください'); return }
    if (endDate < startDate)    { setMessage('終了日は開始日以降にしてください'); return }

    setSubmitting(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('leave_requests').insert({
      user_id: user.id, type, start_date: startDate, end_date: endDate,
      reason: reason || null,
    })

    if (error) {
      setMessage('申請に失敗しました: ' + error.message)
    } else {
      setMessage('申請が完了しました！承認をお待ちください。')
      setStartDate(''); setEndDate(''); setReason('')
      await fetchRequests()
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <h1 className="text-base font-bold text-gray-800">休暇申請</h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">新規申請</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">休暇種別</label>
                <select
                  value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">開始日</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">終了日</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {calcDays() > 0 && (
                <div className="bg-blue-50 rounded-lg px-4 py-2.5 text-sm text-blue-600 font-semibold">
                  申請日数：{calcDays()} 日
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">理由（任意）</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  rows={3} placeholder="申請理由を入力してください"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {message && (
                <div className={`text-sm px-3 py-2.5 rounded-lg ${message.includes('失敗') || message.includes('してください') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                {submitting ? '申請中...' : '申請する'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">申請履歴</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {requests.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">申請履歴はありません</p>
              ) : requests.map(r => {
                const s = STATUS_LABEL[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={r.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{r.type}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.start_date} 〜 {r.end_date}
                    </div>
                    {r.reviewer_comment && (
                      <div className="text-xs text-orange-600 mt-1">💬 {r.reviewer_comment}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
