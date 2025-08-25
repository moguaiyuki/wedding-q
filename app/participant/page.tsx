'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ParticipantPage() {
  const [qrCode, setQrCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode.trim()) {
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
        body: JSON.stringify({ qrCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '認証に失敗しました')
        return
      }

      router.push('/participant/waiting')
    } catch (error) {
      console.error('Auth error:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          結婚式クイズへようこそ！
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
              座席カードのQRコードまたはIDを入力
            </label>
            <input
              type="text"
              id="qrCode"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-pink focus:border-transparent"
              placeholder="例: A001"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !qrCode.trim()}
            className="w-full bg-wedding-pink text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '確認中...' : '参加する'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>座席カードにあるQRコードを</p>
          <p>カメラで読み取るか、</p>
          <p>IDを直接入力してください</p>
        </div>
      </div>
    </div>
  )
}