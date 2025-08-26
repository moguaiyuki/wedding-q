import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/error-boundary'
import { NetworkStatus } from '@/components/network-status'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '結婚式クイズ',
  description: '新郎新婦に関するクイズで盛り上がろう！',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary>
          <NetworkStatus />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}