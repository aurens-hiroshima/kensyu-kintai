import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // プロフィール取得（なければメールアドレスを使用）
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name ?? user.email ?? 'ユーザー'
  const department = profile?.department ?? ''

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={userName} department={department} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
