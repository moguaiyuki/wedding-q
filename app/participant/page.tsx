'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ParticipantPage() {
  const [qrCode, setQrCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode.trim()) return

    setIsLoading(true)
    try {
      // TODO: Validate QR code with Supabase
      // For now, redirect to waiting room
      router.push(`/participant/waiting?qr=${qrCode}`)
    } catch (error) {
      console.error('Error:', error)
      alert('QRコードが無効です')
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