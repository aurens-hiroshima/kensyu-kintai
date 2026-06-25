'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

const MEMBERS = [
  { name: '山田 太郎', shifts: ['早','早','休','休','休','遅','遅','夜','夜','休','早','遅','早','早','遅','休','早','早','遅','夜','休','早','遅','早','休','休','早','遅','夜','休','早'] },
  { name: '佐藤 花子', shifts: ['遅','遅','休','休','休','早','早','夜','夜','休','遅','早','遅','早','早','休','遅','遅','早','夜','休','遅','早','遅','休','休','遅','早','夜','休','遅'] },
  { name: '鈴木 一郎', shifts: ['夜','休','早','休','休','遅','休','早','早','遅','夜','早','休','遅','早','休','夜','早','遅','早','休','夜','早','休','休','休','早','遅','夜','休','早'] },
  { name: '田中 美咲', shifts: ['早','夜','休','休','休','早','遅','遅','休','夜','早','遅','遅','休','早','休','早','夜','早','遅','休','早','夜','早','休','休','遅','早','夜','休','遅'] },
]

const SHIFT_STYLE: Record<string, string> = {
  '早': 'bg-blue-100 text-blue-700',
  '遅': 'bg-green-100 text-green-700',
  '夜': 'bg-purple-100 text-purple-700',
  '休': 'bg-gray-100 text-gray-400',
}

const DAYS_IN_MONTH = 31
const WEEKDAYS = ['水','木','金','土','日','月','火','水','木','金','土','日','月','火','水','木','金','土','日','月','火','水','木','金','土','日','月','火','水','木','火']

function calcHours(shifts: string[]) {
  return shifts.filter(s => s !== '休').length * 8
}

export default function ShiftPage() {
  const [month, setMonth] = useState('2026年7月')
  const [showAIBanner, setShowAIBanner] = useState(true)

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3">
        <h1 className="text-base font-bold text-gray-800 flex-1">シフト管理</h1>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        >
          <option>2026年7月</option>
          <option>2026年8月</option>
          <option>2026年9月</option>
        </select>
        <button
          onClick={() => setShowAIBanner(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          🤖 AIシフト自動作成
        </button>
        <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          📥 出力
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">

        {/* AIバナー */}
        {showAIBanner && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 mb-5">
            <span className="text-blue-500 text-lg">💡</span>
            <p className="text-sm text-blue-700 flex-1">
              AIが希望シフトを元に最適なシフトを自動生成できます。「AIシフト自動作成」をクリックしてください。
            </p>
            <button onClick={() => setShowAIBanner(false)} className="text-blue-400 hover:text-blue-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* 凡例 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">月次シフト表 — {month}</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold bg-blue-100 text-blue-700">早</span> 早番 7:00〜16:00</span>
              <span className="flex items-center gap-1"><span className="inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold bg-green-100 text-green-700">遅</span> 遅番 10:00〜19:00</span>
              <span className="flex items-center gap-1"><span className="inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold bg-purple-100 text-purple-700">夜</span> 夜番 22:00〜7:00</span>
              <span className="flex items-center gap-1"><span className="inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold bg-gray-100 text-gray-400">休</span> 休日</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-gray-500 font-semibold border-b border-gray-100 w-24 sticky left-0 bg-gray-50">氏名</th>
                  {Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
                    const wd = WEEKDAYS[i]
                    const isHoliday = wd === '日'
                    const isSat = wd === '土'
                    return (
                      <th key={i} className={`px-1 py-2 text-center border-b border-gray-100 min-w-[36px] font-semibold ${isHoliday ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-500'}`}>
                        <div>{i + 1}</div>
                        <div className="text-gray-300 font-normal">{wd}</div>
                      </th>
                    )
                  })}
                  <th className="px-3 py-2.5 text-gray-500 font-semibold border-b border-gray-100">合計</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m, mi) => (
                  <tr key={mi} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-800 sticky left-0 bg-white whitespace-nowrap">{m.name}</td>
                    {m.shifts.slice(0, DAYS_IN_MONTH).map((s, di) => (
                      <td key={di} className="px-1 py-2 text-center">
                        <span className={`inline-flex w-6 h-6 rounded items-center justify-center font-bold ${SHIFT_STYLE[s] ?? 'bg-gray-100 text-gray-400'}`}>{s}</span>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-gray-700">{calcHours(m.shifts)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 注意書き */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          ※ このシフト表はモックデータです。シフト編集・DB連携機能は今後実装予定です。
        </p>
      </div>
    </div>
  )
}
