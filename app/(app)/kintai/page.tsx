export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

type DaySummary = {
  date: string
  records: { type: string; stamped_at: string }[]
  workStart?: string
  workEnd?: string
  workHours?: string
}

function calcWorkHours(start: string, end: string): string {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 / 60
  const h = Math.floor(diff)
  const m = Math.round((diff - h) * 60)
  return `${h}h${m > 0 ? m + 'm' : ''}`
}

export default async function KintaiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const { data: records } = await supabase
    .from('kintai_records')
    .select('type, stamped_at, location_name')
    .eq('user_id', user!.id)
    .gte('stamped_at', firstOfMonth.toISOString())
    .lte('stamped_at', new Date(lastOfMonth.getFullYear(), lastOfMonth.getMonth(), lastOfMonth.getDate(), 23, 59, 59).toISOString())
    .order('stamped_at', { ascending: true })

  // 日付ごとにグループ化
  const byDay = new Map<string, { type: string; stamped_at: string }[]>()
  for (const r of records ?? []) {
    const key = new Date(r.stamped_at).toLocaleDateString('ja-JP')
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(r)
  }

  const summaries: DaySummary[] = Array.from(byDay.entries()).map(([date, recs]) => {
    const start = recs.find(r => r.type === '出勤')?.stamped_at
    const end   = recs.find(r => r.type === '退勤')?.stamped_at
    return {
      date,
      records: recs,
      workStart: start,
      workEnd:   end,
      workHours: start && end ? calcWorkHours(start, end) : undefined,
    }
  }).reverse()

  const workDays = summaries.filter(s => s.workStart).length
  const totalRecs = records?.length ?? 0

  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <h1 className="text-base font-bold text-gray-800 flex-1">勤怠一覧</h1>
        <span className="text-sm text-gray-500">
          {year}年{month + 1}月
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* 月次サマリー */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase">出勤日数</div>
            <div className="text-4xl font-bold text-gray-800 mt-1">{workDays}<span className="text-lg text-gray-400 ml-1">日</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase">打刻件数</div>
            <div className="text-4xl font-bold text-gray-800 mt-1">{totalRecs}<span className="text-lg text-gray-400 ml-1">件</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase">記録日数</div>
            <div className="text-4xl font-bold text-gray-800 mt-1">{summaries.length}<span className="text-lg text-gray-400 ml-1">日</span></div>
          </div>
        </div>

        {/* 打刻一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">日次打刻記録</h2>
          </div>

          {summaries.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">日付</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">出勤</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">退勤</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">勤務時間</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">打刻詳細</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s, i) => (
                  <tr key={s.date} className={`border-t border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3 font-medium text-gray-700">{s.date}</td>
                    <td className="px-4 py-3 text-gray-600">{formatTime(s.workStart)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatTime(s.workEnd)}</td>
                    <td className="px-4 py-3">
                      {s.workHours ? (
                        <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded">
                          {s.workHours}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">計算不可</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {s.records.map(r => r.type).join(' → ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>今月の打刻記録がありません</p>
              <a href="/stamp" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
                打刻ページへ →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
