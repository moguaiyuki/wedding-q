'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ParticipantContent() {
  const [qrCode, setQrCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // URLパラメータからQRコードを取得して自動ログイン
  useEffect(() => {
    const qrParam = searchParams.get('qr')
    if (qrParam && !autoLoginAttempted) {
      setQrCode(qrParam)
      setAutoLoginAttempted(true)
      handleLogin(qrParam)
    }
  }, [searchParams, autoLoginAttempted])

  const handleLogin = async (code: string) => {
    if (!code.trim()) {
      setError('QRコードまたはIDを入力してください')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '認証に失敗しました')
        return
      }

      // ニックネーム未設定の場合はプロフィール設定画面へ誘導
      if (data.shouldSetupProfile) {
        router.push('/participant/profile?setup=true')
      } else {
        router.push('/participant/waiting')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(qrCode)
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100 p-4 relative overflow-hidden">
      {/* Background decorative icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        <svg className="absolute top-20 left-10 w-16 h-16 text-wedding-gold-200" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="35" r="15" fill="currentColor" opacity="0.3"/>
          <path d="M50 50 L50 60 M45 60 L55 60 M45 65 L55 65" strokeLinecap="round"/>
        </svg>
        <svg className="absolute top-32 right-20 w-20 h-20 text-wedding-pink-400 transform rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="40" cy="40" r="25"/>
          <path d="M60 60 L80 80" strokeLinecap="round"/>
        </svg>
        <svg className="absolute bottom-40 left-16 w-24 h-24 text-wedding-pink-400 transform -rotate-45" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 80 L30 70 L70 30 L80 20 L90 30 L80 40 L40 80 L30 90 L20 80 Z" fill="currentColor" opacity="0.3"/>
        </svg>
        <svg className="absolute bottom-32 right-24 w-16 h-16 text-wedding-rose-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="30"/>
          <path d="M50 50 L50 30 M50 50 L65 50" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 font-serif">
          クイズに参加！
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
              座席カードの4桁のIDを入力
            </label>
            <input
              type="text"
              maxLength={4}
              id="qrCode"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-pink-400 focus:border-transparent focus:ring-offset-2 min-h-[44px] text-center text-2xl font-bold tracking-widest uppercase"
              placeholder="A1B2"
              disabled={isLoading}
              aria-label="4桁のID（英数字）"
              aria-describedby="qr-instructions"
              aria-invalid={error ? 'true' : 'false'}
              aria-errormessage={error ? 'login-error' : undefined}
            />
            <span id="qr-instructions" className="sr-only">席札の4桁のID（英数字）を入力してください</span>
          </div>

          {error && (
            <div id="login-error" className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg" role="alert" aria-live="assertive">
              <span className="sr-only">エラー:</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !qrCode.trim()}
            className="w-full bg-wedding-pink-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-wedding-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-wedding-pink-400 focus:ring-offset-2 min-h-[44px] shadow-lg"
            aria-label={isLoading ? '確認中' : 'クイズに参加する'}
            aria-busy={isLoading}
          >
            {isLoading ? '確認中...' : (
              <span className="flex items-center justify-center gap-2">
                参加する
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>座席カードに記載された</p>
          <p>4桁のID（英数字）を入力してください</p>
        </div>

        {/* Decorative star */}
        <div className="absolute -top-4 -right-4 w-12 h-12 text-wedding-gold-200">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ParticipantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ParticipantContent />
    </Suspense>
  )
}