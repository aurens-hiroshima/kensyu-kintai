export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', {
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 今日の打刻を取得
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayRecords } = await supabase
    .from('kintai_records')
    .select('*')
    .eq('user_id', user!.id)
    .gte('stamped_at', today.toISOString())
    .order('stamped_at', { ascending: true })

  // 今月の打刻を取得
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const { data: monthRecords } = await supabase
    .from('kintai_records')
    .select('*')
    .eq('user_id', user!.id)
    .gte('stamped_at', firstOfMonth.toISOString())

  // 出勤中かどうか
  const lastRecord = todayRecords?.[todayRecords.length - 1]
  const isWorking = lastRecord?.type === '出勤' || lastRecord?.type === '戻り'

  // 今月の出勤日数（簡易計算）
  const workDays = new Set(
    monthRecords
      ?.filter(r => r.type === '出勤')
      .map(r => new Date(r.stamped_at).toDateString())
  ).size

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const userName = profile?.full_name ?? user!.email ?? 'ユーザー'

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <h1 className="text-base font-bold text-gray-800 flex-1">ダッシュボード</h1>
        {isWorking && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            ● 出勤中　{todayRecords?.find(r => r.type === '出勤') ? formatTime(todayRecords.find(r => r.type === '出勤')!.stamped_at) + '〜' : ''}
          </span>
        )}
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <p className="text-gray-500 text-sm mb-5">おはようございます、<strong className="text-gray-800">{userName}</strong> さん</p>

        {/* KPIカード */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wide">今月出勤日数</div>
            <div className="text-4xl font-bold mt-1">{workDays}<span className="text-lg font-normal text-blue-200 ml-1">日</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">今日の打刻件数</div>
            <div className="text-4xl font-bold mt-1 text-gray-800">{todayRecords?.length ?? 0}<span className="text-lg font-normal text-gray-400 ml-1">件</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ステータス</div>
            <div className={`text-2xl font-bold mt-1 ${isWorking ? 'text-green-600' : 'text-gray-400'}`}>
              {isWorking ? '出勤中' : '退勤済 / 未出勤'}
            </div>
          </div>
        </div>

        {/* 本日の打刻履歴 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">本日の打刻履歴</h2>
          </div>
          <div className="p-5">
            {todayRecords && todayRecords.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">種別</th>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-6">時刻</th>
                    <th className="text-left text-xs font-semibold text-gray-400 pb-3">場所</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.map(record => (
                    <tr key={record.id} className="border-t border-gray-50">
                      <td className="py-2.5 pr-6 font-medium">{record.type}</td>
                      <td className="py-2.5 pr-6 text-gray-600">{formatTime(record.stamped_at)}</td>
                      <td className="py-2.5 text-gray-400 text-xs">{record.location_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">
                本日の打刻はまだありません。<br />
                <a href="/stamp" className="text-blue-500 hover:underline mt-1 inline-block">打刻ページへ →</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
