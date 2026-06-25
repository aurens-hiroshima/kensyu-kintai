import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'オーレンス 勤怠管理システム',
  description: 'クラウド型勤怠管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  )
}
