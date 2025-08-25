'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function WaitingPage() {
  const searchParams = useSearchParams()
  const qrCode = searchParams.get('qr')
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    // TODO: Connect to Supabase Realtime for game state updates
    // Simulate participant count
    setParticipantCount(Math.floor(Math.random() * 60) + 1)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white p-4">
      <div className="text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            準備完了！
          </h1>
          
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-2">参加者ID</p>
            <p className="text-2xl font-mono font-bold text-wedding-pink">{qrCode}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">現在の参加者数</p>
            <p className="text-4xl font-bold text-gray-800">{participantCount}名</p>
          </div>

          <div className="space-y-2 text-gray-600">
            <p>まもなくクイズが始まります</p>
            <p>この画面のままお待ちください</p>
          </div>

          <div className="mt-8">
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-wedding-pink rounded-full"></div>
                <div className="w-3 h-3 bg-wedding-pink rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-wedding-pink rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>画面を閉じないでください</p>
        </div>
      </div>
    </div>
  )
}