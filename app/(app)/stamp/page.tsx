'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type StampType = '出勤' | '退勤' | '外出' | '戻り'

type Record = {
  id: string
  type: string
  stamped_at: string
  location_name: string | null
}

const STAMP_BUTTONS: { type: StampType; label: string; color: string }[] = [
  { type: '出勤', label: '🟢 出勤',  color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { type: '退勤', label: '⬛ 退勤',  color: 'bg-gray-700 hover:bg-gray-800 text-white' },
  { type: '外出', label: '🟠 外出',  color: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { type: '戻り', label: '✅ 戻り',  color: 'bg-green-600 hover:bg-green-700 text-white' },
]

export default function StampPage() {
  const supabase = createClient()
  const router = useRouter()

  const [clock, setClock] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [gpsStatus, setGpsStatus] = useState('GPS取得中...')
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState<StampType | null>(null)
  const [message, setMessage] = useState('')

  // 時計
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDateStr(now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('このブラウザはGPS非対応')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        })
        setGpsStatus('GPS取得済み')
      },
      () => setGpsStatus('GPS取得失敗（手動打刻）'),
      { timeout: 8000 }
    )
  }, [])

  // 今日の打刻履歴
  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('kintai_records')
      .select('id, type, stamped_at, location_name')
      .eq('user_id', user.id)
      .gte('stamped_at', today.toISOString())
      .order('stamped_at', { ascending: true })

    setRecords(data ?? [])
  }

  useEffect(() => { fetchRecords() }, [])

  // 打刻
  const handleStamp = async (type: StampType) => {
    setLoading(type)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('kintai_records').insert({
      user_id: user.id,
      type,
      stamped_at: new Date().toISOString(),
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      location_name: location?.name ?? null,
    })

    if (error) {
      setMessage('打刻に失敗しました: ' + error.message)
    } else {
      setMessage(`${type}打刻が完了しました（${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）`)
      await fetchRecords()
    }
    setLoading(null)
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <h1 className="text-base font-bold text-gray-800">打刻</h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 max-w-3xl">

          {/* 打刻パネル */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="text-5xl font-bold text-gray-800 tracking-wide">{clock}</div>
            <div className="text-gray-400 text-sm mt-1">{dateStr}</div>

            {/* 打刻ボタン */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {STAMP_BUTTONS.map(btn => (
                <button
                  key={btn.type}
                  onClick={() => handleStamp(btn.type)}
                  disabled={loading !== null}
                  className={`py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed ${btn.color}`}
                >
                  {loading === btn.type ? '処理中...' : btn.label}
                </button>
              ))}
            </div>

            {/* GPS表示 */}
            <div className="mt-4 bg-gray-50 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-gray-500">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${location ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              {gpsStatus}
              {location && <span className="text-xs truncate ml-1">{location.name}</span>}
            </div>

            {/* メッセージ */}
            {message && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}
          </div>

          {/* 本日の打刻履歴 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">本日の打刻履歴</h2>
            </div>
            <div className="p-5">
              {records.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-gray-400 font-semibold pb-2">種別</th>
                      <th className="text-left text-xs text-gray-400 font-semibold pb-2">時刻</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} className="border-t border-gray-50">
                        <td className="py-2 font-medium text-gray-700">{r.type}</td>
                        <td className="py-2 text-gray-500">{formatTime(r.stamped_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">
                  本日の打刻はまだありません
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
