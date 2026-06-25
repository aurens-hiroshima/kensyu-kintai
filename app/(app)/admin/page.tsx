export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: kintaiData } = await supabase
    .from('kintai_records')
    .select('user_id, type, stamped_at')
    .gte('stamped_at', firstOfMonth)

  const { data: leaveData } = await supabase
    .from('leave_requests')
    .select('user_id, type, status, start_date, end_date')
    .gte('start_date', firstOfMonth.slice(0, 10))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, department')

  const workingUsers = new Set(kintaiData?.filter(r => r.type === '出勤').map(r => r.user_id)).size
  const totalUsers   = profiles?.length ?? 0
  const attendanceRate = totalUsers > 0 ? Math.round((workingUsers / totalUsers) * 100) : 0

  const pendingLeave   = leaveData?.filter(r => r.status === 'pending').length ?? 0
  const approvedLeave  = leaveData?.filter(r => r.status === 'approved').length ?? 0

  const deptCount: Record<string, number> = {}
  for (const p of profiles ?? []) {
    const dept = p.department ?? '未設定'
    const hasPunch = kintaiData?.some(k => k.user_id === p.id && k.type === '出勤')
    if (hasPunch) deptCount[dept] = (deptCount[dept] ?? 0) + 1
  }

  const month = `${now.getFullYear()}年${now.getMonth() + 1}月`

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <h1 className="text-base font-bold text-gray-800 flex-1">管理者ダッシュボード</h1>
        <span className="text-sm text-gray-400">{month}</span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wide">今月出勤率</div>
            <div className="text-4xl font-bold mt-1">{attendanceRate}<span className="text-lg font-normal text-blue-200">%</span></div>
            <div className="text-blue-200 text-xs mt-1">{workingUsers} / {totalUsers} 名</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">登録ユーザー</div>
            <div className="text-4xl font-bold mt-1 text-gray-800">{totalUsers}<span className="text-lg text-gray-400 ml-1">名</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">休暇申請（未処理）</div>
            <div className={`text-4xl font-bold mt-1 ${pendingLeave > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
              {pendingLeave}<span className="text-lg text-gray-400 ml-1">件</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">休暇承認済（今月）</div>
            <div className="text-4xl font-bold mt-1 text-gray-800">{approvedLeave}<span className="text-lg text-gray-400 ml-1">件</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">部署別出勤状況</h2>
            </div>
            <div className="p-5 space-y-3">
              {Object.keys(deptCount).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">データなし</p>
              ) : Object.entries(deptCount).map(([dept, count]) => {
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{dept}</span>
                      <span className="text-gray-500">{count}名 ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">ユーザー一覧</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs text-gray-400 font-semibold px-5 py-3">氏名</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">部署</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">今月打刻</th>
                  </tr>
                </thead>
                <tbody>
                  {(profiles ?? []).map(p => {
                    const punchCount = kintaiData?.filter(k => k.user_id === p.id).length ?? 0
                    return (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 font-medium text-gray-800">{p.full_name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-500">{p.department ?? '未設定'}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded">
                            {punchCount}件
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {(profiles?.length ?? 0) === 0 && (
                <p className="text-gray-400 text-sm text-center py-6">ユーザーデータなし</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">今月の休暇申請一覧</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs text-gray-400 font-semibold px-5 py-3">申請者</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">種別</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">期間</th>
                    <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {(leaveData ?? []).map((r, i) => {
                    const prof = profiles?.find(p => p.id === r.user_id)
                    const statusMap: Record<string, string> = {
                      pending: 'bg-orange-100 text-orange-700',
                      approved: 'bg-green-100 text-green-700',
                      rejected: 'bg-red-100 text-red-700',
                      returned: 'bg-gray-100 text-gray-600',
                    }
                    const statusLabel: Record<string, string> = {
                      pending: '申請中', approved: '承認済',
                      rejected: '否認', returned: '差戻し',
                    }
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 font-medium text-gray-800">{prof?.full_name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{r.type}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{r.start_date} 〜 {r.end_date}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusMap[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {statusLabel[r.status] ?? r.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {(leaveData?.length ?? 0) === 0 && (
                    <tr><td colSpan={4} className="text-center text-gray-400 py-6 text-sm">今月の申請データなし</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
