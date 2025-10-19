import type { Metadata } from 'next'
import { M_PLUS_Rounded_1c, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/error-boundary'
import { NetworkStatus } from '@/components/network-status'

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['500', '700', '800'],
  subsets: ['latin'],
  variable: '--font-rounded',
})

const playfair = Playfair_Display({
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-serif',
})

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
      <body className={`${mPlusRounded.variable} ${playfair.variable} font-rounded`}>
        <ErrorBoundary>
          <NetworkStatus />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}